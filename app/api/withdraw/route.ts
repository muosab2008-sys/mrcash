import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getClientIp } from "@/lib/validation";
import { pointsToUSD, sendFaucetPay, sendCwalletTransfer } from "@/lib/payments";

const MANUAL_REVIEW_THRESHOLD = 5000; // points
const DUPLICATE_OFFER_LIMIT = 2; // same offerId on same IP completed this many times => freeze

type WithdrawMethod = "faucetpay" | "cwallet";

interface WithdrawBody {
  userId: string;
  pointsToWithdraw: number;
  method: WithdrawMethod;
  walletAddress: string;
  currency: string;
  offerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<WithdrawBody>;
    const { userId, method, walletAddress, currency, offerId } = body;
    const pointsToWithdraw = Number(body.pointsToWithdraw);
    const ipAddress = getClientIp(request.headers);

    // ---------- Input validation ----------
    if (!userId || !method || !walletAddress || !currency) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!Number.isFinite(pointsToWithdraw) || pointsToWithdraw <= 0) {
      return NextResponse.json({ error: "Invalid points amount." }, { status: 400 });
    }
    if (method !== "faucetpay" && method !== "cwallet") {
      return NextResponse.json({ error: "Unsupported withdrawal method." }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);

    // ---------- Atomically validate balance + lock points ----------
    let lockResult: { ok: boolean; reason?: string; username?: string; email?: string };
    try {
      lockResult = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists) return { ok: false, reason: "User not found." };

        const data = snap.data()!;
        if (data.isBanned) return { ok: false, reason: "Account is banned." };

        const balance = Number(data.points || 0);
        if (balance < pointsToWithdraw) return { ok: false, reason: "Insufficient balance." };

        // Lock the points immediately to prevent double-spend / race conditions.
        tx.update(userRef, { points: FieldValue.increment(-pointsToWithdraw) });
        return { ok: true, username: data.username, email: data.email };
      });
    } catch (err: any) {
      console.error("[v0] withdraw: lock transaction failed:", err?.message || err);
      return NextResponse.json({ error: "Failed to process withdrawal." }, { status: 500 });
    }

    if (!lockResult.ok) {
      return NextResponse.json({ error: lockResult.reason }, { status: 400 });
    }

    const amountUSD = pointsToUSD(pointsToWithdraw);

    // Base withdrawal record (points already deducted/locked above).
    const withdrawalRef = adminDb.collection("withdrawals").doc();
    const baseDoc = {
      userId,
      username: lockResult.username || null,
      email: lockResult.email || null,
      method,
      currency: String(currency).toUpperCase(),
      walletAddress,
      paymentDetails: walletAddress,
      offerId: offerId || null,
      pointsDeducted: pointsToWithdraw,
      amountUSD,
      ipAddress,
      createdAt: FieldValue.serverTimestamp(),
    };

    // ---------- Fraud filter 1: high-value manual review ----------
    if (pointsToWithdraw >= MANUAL_REVIEW_THRESHOLD) {
      await withdrawalRef.set({
        ...baseDoc,
        status: "pending",
        reviewReason: `High value: ${pointsToWithdraw} points >= ${MANUAL_REVIEW_THRESHOLD} threshold`,
      });
      console.log(`[v0] withdraw: ${withdrawalRef.id} flagged for manual review (high value)`);
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Your withdrawal is under manual review for security. You'll be notified once approved.",
        withdrawalId: withdrawalRef.id,
      });
    }

    // ---------- Fraud filter 2: duplicate offer on same IP ----------
    if (offerId) {
      const dupSnap = await adminDb
        .collection("transactions")
        .where("userId", "==", userId)
        .where("offerId", "==", offerId)
        .where("userIp", "==", ipAddress)
        .get();

      if (dupSnap.size >= DUPLICATE_OFFER_LIMIT) {
        await withdrawalRef.set({
          ...baseDoc,
          status: "review_required",
          reviewReason: "High Risk: Duplicate Offer ID on same IP detected",
          riskFlag: true,
        });
        console.log(`[v0] withdraw: ${withdrawalRef.id} frozen (duplicate offer on same IP)`);
        return NextResponse.json({
          success: true,
          status: "review_required",
          message: "Your withdrawal requires additional verification and is under review.",
          withdrawalId: withdrawalRef.id,
        });
      }
    }

    // ---------- Automated instant payout ----------
    await withdrawalRef.set({ ...baseDoc, status: "processing" });

    let payoutOk = false;
    let payoutMessage = "";
    let providerRef: string | undefined;
    let providerRaw: unknown = null;

    if (method === "faucetpay") {
      const result = await sendFaucetPay({ to: walletAddress, amountUSD, currency });
      payoutOk = result.ok;
      payoutMessage = result.message;
      providerRef = result.payoutId;
      providerRaw = result.raw;
    } else {
      // cwallet via CCPayment
      const result = await sendCwalletTransfer({
        toAddress: walletAddress,
        amountUSD,
        currency,
        orderId: withdrawalRef.id,
      });
      payoutOk = result.ok;
      payoutMessage = result.message;
      providerRef = result.orderId;
      providerRaw = result.raw;
    }

    if (payoutOk) {
      await withdrawalRef.update({
        status: "completed",
        providerRef: providerRef || null,
        providerResponse: providerRaw ?? null,
        processedAt: FieldValue.serverTimestamp(),
      });
      console.log(`[v0] withdraw: ${withdrawalRef.id} completed via ${method}`);
      return NextResponse.json({
        success: true,
        status: "completed",
        message: "Payout sent instantly!",
        withdrawalId: withdrawalRef.id,
      });
    }

    // ---------- Payout failed: refund the locked points ----------
    await adminDb.runTransaction(async (tx) => {
      tx.update(userRef, { points: FieldValue.increment(pointsToWithdraw) });
      tx.update(withdrawalRef, {
        status: "failed",
        failureReason: payoutMessage,
        providerResponse: providerRaw ?? null,
        refunded: true,
        processedAt: FieldValue.serverTimestamp(),
      });
    });

    console.log(`[v0] withdraw: ${withdrawalRef.id} failed via ${method} - points refunded`);
    return NextResponse.json(
      { success: false, status: "failed", error: payoutMessage || "Payout failed. Your points have been refunded." },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("[v0] withdraw error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
