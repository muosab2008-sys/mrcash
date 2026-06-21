import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // --- 1. Flexible User ID Search ---
    const userKeys = ["user_id", "s1", "sub1", "uid", "subId", "click_id", "external_id"];
    let userId = "";
    for (const key of userKeys) {
      if (searchParams.get(key)) {
        userId = searchParams.get(key) || "";
        break;
      }
    }

    if (!userId) return new NextResponse("ok", { status: 200 });

    // --- 2. Flexible Amount Search (USD directly from companies) ---
    // Companies send payout in USD - we multiply by 1000 to convert to internal points
    // 1 USD = 1000 points internally
    const valueKeys = ["payout_usd", "payout", "amount", "value", "reward", "usd", "revenue"];
    let rawValue = "0";
    for (const key of valueKeys) {
      if (searchParams.get(key)) {
        rawValue = searchParams.get(key) || "0";
        break;
      }
    }

    // Parse the USD value and convert to internal points (1 USD = 1000 points)
    let usdAmount = parseFloat(rawValue);
    if (isNaN(usdAmount) || usdAmount <= 0) return new NextResponse("ok", { status: 200 });

    // Convert USD to internal points (multiply by 1000)
    let points = usdAmount * 1000;

    // --- 3. Flexible Offer and Wall Name Search ---
    const wallName = searchParams.get("wall") || searchParams.get("source") || searchParams.get("network") || "Offerwall";
    const offerName = searchParams.get("offer_name") || searchParams.get("off_name") || searchParams.get("ad_name") || searchParams.get("campaign") || "Task";

    // --- 4. Unique Transaction ID (Duplicate Prevention) ---
    const txId = searchParams.get("signature") || searchParams.get("token") || searchParams.get("txid") || searchParams.get("transaction_id") || searchParams.get("tid") || `AUTO-${Date.now()}`;

    // --- 5. Database Operations ---
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    // Create user if doesn't exist
    if (!userSnap.exists) {
      await userRef.set({
        userId: userId,
        username: userId.includes("@") ? userId.split("@")[0] : "User",
        points: 0,
        totalEarned: 0,
        level: 1,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Check for duplicate transaction
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", txId).limit(1).get();
    if (!dupCheck.empty) return new NextResponse("ok", { status: 200 });

    const batch = adminDb.batch();

    // Update points and balance
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
    });

    // Record the transaction with USD amount
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userId,
      transactionId: txId,
      offerwall: wallName,
      offerName: offerName,
      points: points,
      amountUSD: usdAmount, // Store original USD amount
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send notification with USD display
    batch.set(adminDb.collection("notifications").doc(), {
      userId: userId,
      title: "Reward Added!",
      message: `You earned $${usdAmount.toFixed(2)} from ${offerName}.`,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Add to Live Feed
    batch.set(adminDb.collection("live_feed").doc(), {
      userId: userId,
      username: userId.includes("@") ? userId.split("@")[0] : "User",
      points: points,
      amountUSD: usdAmount,
      source: wallName,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return new NextResponse("ok", { status: 200 });

  } catch (err) {
    console.error("Postback Error:", err);
    return new NextResponse("ok", { status: 200 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
