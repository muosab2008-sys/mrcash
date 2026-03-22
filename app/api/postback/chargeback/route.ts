import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const adminDb = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userId = searchParams.get("user_id") || searchParams.get("uid") || searchParams.get("subid") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || searchParams.get("offer_id") || "";

    if (!userId || !transactionId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the original transaction
    const txQuery = await adminDb
      .collection("transactions")
      .where("transactionId", "==", transactionId)
      .where("offerwall", "==", wall)
      .get();

    if (txQuery.empty) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const txDoc = txQuery.docs[0];
    const txData = txDoc.data();

    if (txData.status === "chargedback") {
      return NextResponse.json(
        { success: false, error: "Already charged back" },
        { status: 200 }
      );
    }

    const points = txData.points || 0;

    // Update transaction status
    await txDoc.ref.update({
      status: "chargedback",
      chargebackAt: FieldValue.serverTimestamp(),
    });

    // Deduct points from user
    const userRef = adminDb.collection("users").doc(userId);
    await userRef.update({
      points: FieldValue.increment(-points),
      totalEarned: FieldValue.increment(-points),
    });

    // If there was a referral bonus, deduct that too
    const referralQuery = await adminDb
      .collection("referral_earnings")
      .where("sourceTransaction", "==", transactionId)
      .get();

    for (const refDoc of referralQuery.docs) {
      const refData = refDoc.data();
      const referrerRef = adminDb.collection("users").doc(refData.referrerId);
      await referrerRef.update({
        points: FieldValue.increment(-refData.earnedPoints),
        totalEarned: FieldValue.increment(-refData.earnedPoints),
      });
      await refDoc.ref.delete();
    }

    return NextResponse.json({ success: true, deducted: points });
  } catch (error) {
    console.error("Chargeback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
