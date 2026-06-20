import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getClientIp } from "@/lib/security";
import { faucetPaySend } from "@/lib/faucetpay";
import { cwalletTransfer } from "@/lib/ccpayment";

export const dynamic = "force-dynamic";

// Platform conversion rate: 1000 points = $1.00 USD.
const POINTS_PER_USD = 1000;
const MANUAL_REVIEW_THRESHOLD = 5000;
const CCPAYMENT_DEFAULT_COIN_ID = process.env.CCPAYMENT_DEFAULT_COIN_ID || "1280"; // e.g. USDT

const pointsToUSD = (points: number) => Number((points / POINTS_PER_USD).toFixed(2));

type WithdrawStatus = "pending" | "review_required" | "processing" | "completed" | "failed";

interface WithdrawBody {
  userId?: string;
  pointsToWithdraw?: number;
  method?: string;
  walletAddress?: string;
  currency?: string;
  offerId?: string;
}

export async function POST(req: NextRequest) {
  const ipAddress = getClientIp(req);

  try {
    const body = (await req.json()) as WithdrawBody;
    const userId = (body.userId || "").trim();
    const pointsToWithdraw = Math.floor(Number(body.pointsToWithdraw));
    const method = (body.method || "").trim().toLowerCase();
    const walletAddress = (body.walletAddress || "").trim();
    const currency = (body.currency || "").trim().toUpperCase();
    const offerId = (body.offerId || "").trim() || null;

    // 1) Input validation ---------------------------------------------------
    if (!userId || !method || !walletAddress) {
      return NextResponse.json({ error: "Missing required withdrawal fields." }, { status: 400 });
    }
    if (!Number.isFinite(pointsToWithdraw) || pointsToWithdraw <= 0) {
      return NextResponse.json({ error: "Invalid points amount." }, { status: 400 });
    }
    if (!["faucetpay", "cwallet"].includes(method)) {
      return NextResponse.json({ error: "Unsupported withdrawal method." }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const amountUSD = pointsToUSD(pointsToWithdraw);

    // 2) Duplicate offer on same IP fraud check -----------------------------
    let fraudFlag: string | null = null;
    if (offerId) {
      const dupSnap = await adminDb
        .collection("transactions")
        .where("userId", "==", userId)
        .where("offerId", "==", offerId)
        .where("ipAddress", "==", ipAddress)
        .get();

      if (dupSnap.size > 1) {
        fraudFlag = "High Risk: Duplicate Offer ID on same IP detected";
        console.warn(`[v0] withdraw: ${fraudFlag} (user=${userId}, offer=${offerId}, ip=${ipAddress})`);
      }
    }

    // 3) Decide the initial status ------------------------------------------
    let initialStatus: WithdrawStatus;
    if (fraudFlag) {
      initialStatus = "review_required";
    } else if (pointsToWithdraw >= MANUAL_REVIEW_THRESHOLD) {
      initialStatus = "pending"; // lock capital, await manual admin review
    } else {
      initialStatus = "processing"; // eligible for instant auto-payout
    }

    // 4) Atomically lock points + create the withdrawal doc -----------------
    let withdrawalId = "";
    try {
      withdrawalId = await adminDb.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) throw new Error("USER_NOT_FOUND");

        const currentPoints = Number(userSnap.data()?.points || 0);
        if (currentPoints < pointsToWithdraw) throw new Error("INSUFFICIENT_BALANCE");

        // Lock (deduct) the points immediately to secure capital.
        tx.update(userRef, { points: currentPoints - pointsToWithdraw });

        const wRef = adminDb.collection("withdrawals").doc();
        tx.set(wRef, {
          userId,
          method,
          currency: currency || null,
          walletAddress,
          offerId,
          pointsDeducted: pointsToWithdraw,
          amountUSD,
          status: initialStatus,
          fraudFlag,
          ipAddress,
          autoPayout: initialStatus === "processing",
          createdAt: FieldValue.serverTimestamp(),
        });
        return wRef.id;
      });
    } catch (txErr: any) {
      if (txErr.message === "USER_NOT_FOUND") {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }
      if (txErr.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json({ error: "Insufficient point balance." }, { status: 400 });
      }
      throw txErr;
    }

    const withdrawalRef = adminDb.collection("withdrawals").doc(withdrawalId);

    // 5) Held for review — stop here. ---------------------------------------
    if (initialStatus !== "processing") {
      console.log(`[v0] withdraw: ${withdrawalId} held as "${initialStatus}" (points=${pointsToWithdraw}).`);
      return NextResponse.json(
        {
          success: true,
          status: initialStatus,
          withdrawalId,
          message:
            initialStatus === "review_required"
              ? "Your withdrawal is under security review."
              : "Large withdrawals are queued for manual review and will be processed within 24 hours.",
        },
        { status: 202 }
      );
    }

    // 6) Automated instant payout -------------------------------------------
    try {
      if (method === "faucetpay") {
        const result = await faucetPaySend(walletAddress, String(amountUSD), currency || "USDT");
        if (!result.ok) throw new Error(result.error || "FaucetPay payout failed");
        await withdrawalRef.update({
          status: "completed",
          gateway: "faucetpay",
          gatewayResponse: result.data ?? null,
          completedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // cWallet internal transfer (CCPayment)
        const coinId = currency && /^\d+$/.test(currency) ? currency : CCPAYMENT_DEFAULT_COIN_ID;
        const result = await cwalletTransfer({
          toUserId: walletAddress,
          coinId,
          amount: String(amountUSD),
          orderId: withdrawalId,
          remark: "MrCash instant payout",
        });
        const okCode = result.data?.code === 10000 || result.ok;
        if (!okCode) throw new Error(result.data?.msg || result.error || "cWallet transfer failed");
        await withdrawalRef.update({
          status: "completed",
          gateway: "cwallet",
          gatewayResponse: result.data ?? null,
          completedAt: FieldValue.serverTimestamp(),
        });
      }

      console.log(`[v0] withdraw: ${withdrawalId} completed via ${method} ($${amountUSD}).`);
      return NextResponse.json(
        { success: true, status: "completed", withdrawalId, amountUSD, message: "Payout sent successfully." },
        { status: 200 }
      );
    } catch (payErr: any) {
      // Refund the locked points and mark the request failed.
      console.error(`[v0] withdraw: payout failed for ${withdrawalId}:`, payErr?.message);
      await adminDb
        .runTransaction(async (tx) => {
          const snap = await tx.get(userRef);
          const pts = Number(snap.data()?.points || 0);
          tx.update(userRef, { points: pts + pointsToWithdraw });
          tx.update(withdrawalRef, {
            status: "failed" as WithdrawStatus,
            failureReason: payErr?.message || "Payout failed",
            refunded: true,
            failedAt: FieldValue.serverTimestamp(),
          });
        })
        .catch((e) => console.error(`[v0] withdraw: refund failed for ${withdrawalId}:`, e?.message));

      return NextResponse.json(
        { success: false, status: "failed", withdrawalId, error: "Payout failed. Your points have been refunded." },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("[v0] withdraw: unexpected error:", err?.message);
    return NextResponse.json({ error: "Something went wrong processing your withdrawal." }, { status: 500 });
  }
}
