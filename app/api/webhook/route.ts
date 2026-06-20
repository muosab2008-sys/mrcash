import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyWebhookSignature, fetchDepositLedger } from "@/lib/ccpayment";

export const dynamic = "force-dynamic";

/**
 * CCPayment conversion / payment webhook with a double-check audit.
 *
 * Flow:
 *  1. Read the RAW body and verify the inbound HMAC-SHA256 signature.
 *  2. Independently call the official CCPayment ledger to confirm the order.
 *  3. Only mark the withdrawal "completed" if the node ledger reports "Success".
 */
export async function POST(req: NextRequest) {
  try {
    // Use the raw text so the signature is computed over the exact transmitted bytes.
    const rawBody = await req.text();
    const timestamp = req.headers.get("Timestamp") || req.headers.get("timestamp") || "";
    const sign = req.headers.get("Sign") || req.headers.get("sign") || "";

    // 1) Header signature verification ----------------------------------
    if (!timestamp || !sign || !verifyWebhookSignature(timestamp, rawBody, sign)) {
      console.warn("[v0] webhook: signature verification FAILED — rejecting.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    // CCPayment nests details under msg in most events; fall back to top-level.
    const detail = payload?.msg || payload?.data || payload;
    const orderId: string = detail?.order_id || detail?.orderId || payload?.order_id || "";

    if (!orderId) {
      console.warn("[v0] webhook: missing order_id in verified payload.");
      return NextResponse.json({ received: true, note: "no order_id" }, { status: 200 });
    }

    console.log(`[v0] webhook: signature OK for order ${orderId}, running ledger double-check.`);

    // 2) Outbound double-check against the official ledger ----------------
    const ledger = await fetchDepositLedger(orderId);
    if (!ledger.ok || ledger.data?.code !== 10000) {
      console.warn(`[v0] webhook: ledger lookup failed for ${orderId}:`, ledger.data?.msg || ledger.error);
      return NextResponse.json({ received: true, verified: false, note: "ledger lookup failed" }, { status: 200 });
    }

    // Locate the matching record and read its authoritative status.
    const records: any[] = ledger.data?.data?.records || ledger.data?.data?.list || [];
    const match = records.find((r) => (r.order_id || r.orderId) === orderId) || records[0];
    const ledgerStatus = String(match?.status || match?.state || "").toLowerCase();
    const isSuccess = ledgerStatus === "success" || ledgerStatus === "completed";

    // 3) Reconcile Firestore --------------------------------------------
    const wRef = adminDb.collection("withdrawals").doc(orderId);
    const wSnap = await wRef.get();

    if (!wSnap.exists) {
      console.warn(`[v0] webhook: no withdrawal doc for order ${orderId}.`);
      return NextResponse.json({ received: true, verified: isSuccess, note: "withdrawal not found" }, { status: 200 });
    }

    if (isSuccess) {
      await wRef.update({
        status: "completed",
        ledgerVerified: true,
        webhookVerifiedAt: FieldValue.serverTimestamp(),
        gatewayResponse: match ?? null,
      });
      console.log(`[v0] webhook: order ${orderId} verified as Success — marked completed.`);
    } else {
      await wRef.update({
        ledgerVerified: false,
        ledgerStatus: ledgerStatus || "unknown",
        webhookCheckedAt: FieldValue.serverTimestamp(),
      });
      console.warn(`[v0] webhook: order ${orderId} ledger status "${ledgerStatus}" — not completed.`);
    }

    return NextResponse.json({ received: true, verified: isSuccess }, { status: 200 });
  } catch (err: any) {
    console.error("[v0] webhook: unexpected error:", err?.message);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
