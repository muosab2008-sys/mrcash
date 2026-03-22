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

// Offerwall configurations with their secret keys
const OFFERWALL_CONFIGS: Record<string, { secretKey: string; name: string }> = {
  lootably: { secretKey: process.env.LOOTABLY_SECRET || "", name: "Lootably" },
  offertoro: { secretKey: process.env.OFFERTORO_SECRET || "", name: "OfferToro" },
  adgatemedia: { secretKey: process.env.ADGATEMEDIA_SECRET || "", name: "AdGate Media" },
  cpxresearch: { secretKey: process.env.CPXRESEARCH_SECRET || "", name: "CPX Research" },
  bitlabs: { secretKey: process.env.BITLABS_SECRET || "", name: "BitLabs" },
  timewall: { secretKey: process.env.TIMEWALL_SECRET || "", name: "Timewall" },
  ayet: { secretKey: process.env.AYET_SECRET || "", name: "ayeT-Studios" },
  notik: { secretKey: process.env.NOTIK_SECRET || "", name: "Notik" },
  torox: { secretKey: process.env.TOROX_SECRET || "", name: "ToroX" },
  revu: { secretKey: process.env.REVU_SECRET || "", name: "Revenue Universe" },
  mychips: { secretKey: process.env.MYCHIPS_SECRET || "", name: "myChips" },
  hangmyads: { secretKey: process.env.HANGMYADS_SECRET || "", name: "HangMyAds" },
  mmwall: { secretKey: process.env.MMWALL_SECRET || "", name: "MMWall" },
};

// Points conversion rate
const USD_TO_POINTS = 1000; // $1 = 1000 points
const FRAGMENTS_PER_OFFER = 50; // الشظايا التي تضاف لكل عرض

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get common parameters
    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userId = searchParams.get("user_id") || searchParams.get("uid") || searchParams.get("subid") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || searchParams.get("offer_id") || "";
    const payout = parseFloat(searchParams.get("payout") || searchParams.get("amount") || searchParams.get("reward") || "0");
    const signature = searchParams.get("sig") || searchParams.get("signature") || searchParams.get("hash") || "";
    const offerName = searchParams.get("offer_name") || searchParams.get("offer") || "Unknown Offer";
    const ip = searchParams.get("ip") || request.headers.get("x-forwarded-for") || "";

    // Validate required parameters
    if (!wall || !userId || !transactionId || payout <= 0) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // Get offerwall config
    const config = OFFERWALL_CONFIGS[wall];
    if (!config) {
      return NextResponse.json({ success: false, error: "Unknown offerwall" }, { status: 400 });
    }

    // Check for duplicate transaction
    const existingTx = await adminDb
      .collection("transactions")
      .where("transactionId", "==", transactionId)
      .where("offerwall", "==", wall)
      .get();

    if (!existingTx.empty) {
      return NextResponse.json({ success: false, error: "Duplicate transaction" }, { status: 200 });
    }

    // Calculate points
    const points = Math.round(payout * USD_TO_POINTS);

    // Get user document
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    // Check if user is banned
    if (userData?.isBanned) {
      return NextResponse.json({ success: false, error: "User is banned" }, { status: 403 });
    }

    // --- [ نظام المستويات التصاعدي ] ---
    const totalEarnedBefore = userData?.totalEarned || 0;
    const currentLevel = userData?.level || 1;
    const nextLevelThreshold = currentLevel * 10000; // 10k, 20k, 30k...
    
    let levelReward = 0;
    let newLevel = currentLevel;

    if ((totalEarnedBefore + points) >= nextLevelThreshold) {
      newLevel = currentLevel + 1;
      levelReward = 1000; // مكافأة ليفل أب $1
    }

    // --- [ تنفيذ العمليات بصيغة Batch أو متتالية ] ---
    
    // 1. Create transaction record
    await adminDb.collection("transactions").add({
      userId,
      transactionId,
      offerwall: wall,
      offerwallName: config.name,
      offerName,
      payout,
      points,
      fragments: FRAGMENTS_PER_OFFER, // إضافة الشظايا هنا
      ip,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Update user points, level, and fragments
    await userRef.update({
      points: FieldValue.increment(points + levelReward),
      totalEarned: FieldValue.increment(points),
      fragments: FieldValue.increment(FRAGMENTS_PER_OFFER),
      level: newLevel,
    });

    // 3. Handle referral bonus (10% of earned points)
    if (userData?.referredBy) {
      const referralBonus = Math.round(points * 0.1);
      const referrerRef = adminDb.collection("users").doc(userData.referredBy);
      const referrerSnap = await referrerRef.get();

      if (referrerSnap.exists && !referrerSnap.data()?.isBanned) {
        await referrerRef.update({
          points: FieldValue.increment(referralBonus),
          totalEarned: FieldValue.increment(referralBonus),
        });

        // Log referral earning
        await adminDb.collection("referral_earnings").add({
          referrerId: userData.referredBy,
          referredUserId: userId,
          earnedPoints: referralBonus,
          sourceTransaction: transactionId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // 4. Update offerwall statistics (الجزء الذي نقص في الكود السابق)
    const statsRef = adminDb.collection("stats").doc("offerwalls");
    await statsRef.set(
      {
        [wall]: {
          totalTransactions: FieldValue.increment(1),
          totalPayout: FieldValue.increment(payout),
          totalPoints: FieldValue.increment(points),
        },
        totalTransactions: FieldValue.increment(1),
        totalPayout: FieldValue.increment(payout),
        totalPoints: FieldValue.increment(points),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 5. إضافة إشعار لحظي (Real-time Notification)
    await adminDb.collection("notifications").add({
      userId,
      title: "عملية ناجحة",
      message: `كسبت ${points} نقطة و ${FRAGMENTS_PER_OFFER} شظية من ${offerName}.` + (levelReward > 0 ? ` مبروك! وصلت للمستوى ${newLevel} وحصلت على 1000 نقطة هدية.` : ""),
      type: "reward",
      createdAt: FieldValue.serverTimestamp(),
      read: false
    });

    return NextResponse.json({ success: true, points, fragments: FRAGMENTS_PER_OFFER });
  } catch (error) {
    console.error("Postback error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
