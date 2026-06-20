import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { cwalletTransfer } from "@/lib/ccpayment";
import { getClientIp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Business constants ------------------------------------------------------
const MANUAL_REVIEW_THRESHOLD = 5000; // points
const POINTS_PER_USD = 1000; // 1000 points = $1.00
const FAUCETPAY_ENDPOINT = "https://faucetpay.io/api/v1/send";

type PayoutMethod = "faucetpay" | "cwallet";

interface WithdrawBody {
  userId?: string;
  pointsToWithdraw?: number;
  method?: PayoutMethod;
  walletAddress?: string;
  currency?: string;
  offerId?: string;
}

interface WithdrawResult {
  status: "completed" | "pending" | "review_required" | "failed";
  message: string;
  transactionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WithdrawBody;
    const { userId, method, walletAddress, currency, offerId } = body;
    const pointsToWithdraw = Number(body.pointsToWithdraw);

    // ---- Validation ---------------------------------------------------------
    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }
    if (!Number.isFinite(pointsToWithdraw) || pointsToWithdraw <= 0) {
      return NextResponse.json({ error: "Invalid points amount." }, { status: 400 });
    }
    if (method !== "faucetpay" && method !== "cwallet") {
      return NextResponse.json({ error: "Unsupported payout method." }, { status: 400 });
    }
    if (!walletAddress || !currency) {
      return NextResponse.json(
        { error: "walletAddress and currency are required." },
        { status: 400 },
      );
    }

    const ipAddress = getClientIp(req.headers);
    const usdValue = +(pointsToWithdraw / POINTS_PER_USD).toFixed(8);

    // ---- Load and validate user --------------------------------------------
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userSnap.data()!;
    if (userData.isBanned) {
      return NextResponse.json({ error: "Account is suspended." }, { status: 403 });
    }
    if ((userData.points || 0) < pointsToWithdraw) {
      return NextResponse.json({ error: "Insufficient points balance." }, { status: 400 });
    }

    const txRef = adminDb.collection("transactions").doc();
    const baseTx = {
      transactionId: txRef.id,
      userId,
      offerId: offerId || null,
      method,
      walletAddress,
      currency,
      pointsToWithdraw,
      usdValue,
      ipAddress,
      createdAt: FieldValue.serverTimestamp(),
    };

    // ---- Atomically lock the points ----------------------------------------
    // Deduct immediately so the balance can't be double-spent during review.
    await adminDb.runTransaction(async (t) => {
      const fresh = await t.get(userRef);
      const freshPoints = fresh.data()?.points || 0;
      if (freshPoints < pointsToWithdraw) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
      t.update(userRef, { points: FieldValue.increment(-pointsToWithdraw) });
    });

    // ---- Fraud filter: large amounts require manual review ------------------
    if (pointsToWithdraw >= MANUAL_REVIEW_THRESHOLD) {
      await txRef.set({
        ...baseTx,
        status: "pending",
        flag: "Manual review: amount >= 5000 points",
        pointsLocked: true,
      });
      console.log(`[withdraw] ${txRef.id} pending manual review (${pointsToWithdraw} pts)`);
      return ok({
        status: "pending",
        message: "Your withdrawal is queued for manual review.",
        transactionId: txRef.id,
      });
    }

    // ---- Fraud filter: duplicate offer on same IP ---------------------------
    if (offerId) {
      const dupSnap = await adminDb
        .collection("transactions")
        .where("userId", "==", userId)
        .where("offerId", "==", offerId)
        .where("ipAddress", "==", ipAddress)
        .where("status", "==", "completed")
        .get();

      if (dupSnap.size >= 1) {
        await txRef.set({
          ...baseTx,
          status: "review_required",
          flag: "High Risk: Duplicate Offer ID on same IP detected",
          pointsLocked: true,
        });
        console.warn(
          `[withdraw] ${txRef.id} frozen — duplicate offer ${offerId} on ip ${ipAddress}`,
        );
        return ok({
          status: "review_required",
          message: "This payout has been flagged for security review.",
          transactionId: txRef.id,
        });
      }
    }

    // ---- Passed filters: attempt instant payout -----------------------------
    await txRef.set({ ...baseTx, status: "processing", pointsLocked: true });

    try {
      if (method === "faucetpay") {
        await payoutFaucetPay({ address: walletAddress, currency, usdValue });
      } else {
        await payoutCwallet({
          orderId: txRef.id,
          address: walletAddress,
          currency,
          usdValue,
        });
      }

      await txRef.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
      console.log(`[withdraw] ${txRef.id} completed via ${method} ($${usdValue})`);
      return ok({
        status: "completed",
        message: "Payout sent successfully.",
        transactionId: txRef.id,
      });
    } catch (payoutErr: any) {
      // Refund the locked points on a failed payout.
      await userRef.update({ points: FieldValue.increment(pointsToWithdraw) });
      await txRef.update({
        status: "failed",
        error: String(payoutErr?.message || payoutErr),
        pointsLocked: false,
      });
      console.error(`[withdraw] ${txRef.id} payout failed, points refunded:`, payoutErr);
      return NextResponse.json(
        { status: "failed", message: "Payout failed. Your points have been refunded." },
        { status: 502 },
      );
    }
  } catch (err: any) {
    if (err?.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ error: "Insufficient points balance." }, { status: 400 });
    }
    console.error("[withdraw] unexpected error:", err);
    return NextResponse.json({ error: "Withdrawal failed. Please try again." }, { status: 500 });
  }
}

function ok(result: WithdrawResult) {
  return NextResponse.json({ success: true, ...result });
}

// --- FaucetPay instant payout ------------------------------------------------
async function payoutFaucetPay(params: {
  address: string;
  currency: string;
  usdValue: number;
}) {
  const apiKey = process.env.FAUCETPAY_API_KEY;
  if (!apiKey) throw new Error("FAUCETPAY_API_KEY is not configured");

  // FaucetPay expects the amount in the smallest unit of the currency.
  // For USD-pegged values we forward the USD figure; convert as needed per coin.
  const form = new URLSearchParams({
    api_key: apiKey,
    amount: params.usdValue.toString(),
    to: params.address,
    currency: params.currency,
  });

  const res = await fetch(FAUCETPAY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.status !== 200) {
    throw new Error(`FaucetPay error: ${data?.message || res.statusText}`);
  }
  return data;
}

// --- Cwallet (CCPayment) instant transfer ------------------------------------
async function payoutCwallet(params: {
  orderId: string;
  address: string;
  currency: string;
  usdValue: number;
}) {
  // coinId mapping should be sourced from CCPayment's coin list; configurable.
  const coinId = Number(process.env.CCPAYMENT_DEFAULT_COIN_ID) || 1280; // USDT default
  const result = await cwalletTransfer({
    orderId: params.orderId,
    coinId,
    address: params.address,
    amount: params.usdValue.toString(),
  });

  if (!result.ok || !result.data || (result.data as any).code !== 10000) {
    throw new Error(`Cwallet transfer error: ${(result.data as any)?.msg || result.status}`);
  }
  return result.data;
}
