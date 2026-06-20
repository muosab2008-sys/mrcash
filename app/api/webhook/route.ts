import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { buildCcSignature, verifyCcSignature, fetchCcDepositList } from "@/lib/ccpayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CCPayment payment/conversion webhook.
 *
 * Security model (defense in depth):
 *   1. Verify the inbound HMAC-SHA256 header signature.
 *   2. Independently re-query CCPayment's ledger and only trust the result
 *      from their infrastructure ("double-check") before mutating Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    // Read the raw body so the signature is computed over the exact bytes.
    const rawBody = await req.text();
    const timestamp = req.headers.get("Timestamp") || "";
    const receivedSign = req.headers.get("Sign") || "";

    if (!timestamp || !receivedSign) {
      console.warn("[webhook] missing signature headers");
      return NextResponse.json({ error: "Missing signature headers." }, { status: 401 });
    }

    // ---- Step 1: verify the header signature --------------------------------
    let expectedSign: string;
    try {
      ({ sign: expectedSign } = buildCcSignature(timestamp, rawBody));
    } catch (cfgErr) {
      console.error("[webhook] signing config error:", cfgErr);
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    if (!verifyCcSignature(expectedSign, receivedSign)) {
      console.warn("[webhook] signature mismatch — possible spoof");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const orderId: string | undefined =
      payload?.orderId || payload?.data?.orderId || payload?.recordId;

    if (!orderId) {
      console.warn("[webhook] payload missing orderId");
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    console.log(`[webhook] signature verified for order ${orderId}`);

    // ---- Step 2: double-check against CCPayment's ledger --------------------
    const ledger = await fetchCcDepositList(orderId);
    if (!ledger.ok || !ledger.data) {
      console.error(`[webhook] ledger lookup failed for ${orderId}`, ledger.status);
      return NextResponse.json({ error: "Ledger verification failed." }, { status: 502 });
    }

    const records = ledger.data.data?.records || [];
    const match = records.find(
      (r: any) => r.orderId === orderId || r.recordId === orderId,
    );
    const verifiedSuccess =
      match &&
      String(match.status).toLowerCase() === "success";

    // ---- Step 3: only update Firestore when verified ------------------------
    const txSnap = await adminDb
      .collection("transactions")
      .where("transactionId", "==", orderId)
      .limit(1)
      .get();

    if (!verifiedSuccess) {
      console.warn(`[webhook] order ${orderId} NOT verified as success on ledger`);
      if (!txSnap.empty) {
        await txSnap.docs[0].ref.update({
          webhookCheckedAt: FieldValue.serverTimestamp(),
          ledgerVerified: false,
        });
      }
      // Acknowledge receipt but do not mark completed.
      return NextResponse.json({ received: true, verified: false });
    }

    if (txSnap.empty) {
      console.warn(`[webhook] no local transaction for verified order ${orderId}`);
      return NextResponse.json({ received: true, verified: true, matched: false });
    }

    await txSnap.docs[0].ref.update({
      status: "completed",
      ledgerVerified: true,
      completedAt: FieldValue.serverTimestamp(),
      webhookCheckedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[webhook] order ${orderId} confirmed completed via ledger`);
    return NextResponse.json({ received: true, verified: true, matched: true });
  } catch (err) {
    console.error("[webhook] unexpected error:", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
