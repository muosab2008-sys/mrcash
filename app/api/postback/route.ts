import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * تهيئة Firebase Admin بطريقة احترافية تمنع أخطاء الـ Build في Vercel
 * وتضمن عدم تكرار الاتصال بقاعدة البيانات
 */
function initializeAdmin() {
  if (!getApps().length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
  return getFirestore();
}

/**
 * إعدادات شركات العروض (Offerwalls)
 * يتم جلب المفاتيح السرية من إعدادات Vercel (Environment Variables)
 */
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

// إعدادات النقاط والشظايا
const USD_TO_POINTS = 1000; // كل 1 دولار يساوي 1000 نقطة
const FRAGMENTS_PER_OFFER = 50; // عدد الشظايا الممنوحة لكل عرض مكتمل

export async function GET(request: NextRequest) {
  try {
    const adminDb = initializeAdmin();
    const { searchParams } = new URL(request.url);

    // جلب البارامترات المشتركة بين كل الشركات
    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userId = searchParams.get("user_id") || searchParams.get("uid") || searchParams.get("subid") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || searchParams.get("offer_id") || "";
    const payout = parseFloat(searchParams.get("payout") || searchParams.get("amount") || searchParams.get("reward") || "0");
    const offerName = searchParams.get("offer_name") || searchParams.get("offer") || "Unknown Offer";
    const ip = searchParams.get("ip") || request.headers.get("x-forwarded-for") || "";

    // 1. التحقق من البيانات الأساسية
    if (!wall || !userId || !transactionId || payout <= 0) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    // 2. التحقق من وجود شركة العرض في الإعدادات
    const config = OFFERWALL_CONFIGS[wall];
    if (!config) {
      return NextResponse.json({ success: false, error: "Unknown offerwall" }, { status: 400 });
    }

    // 3. منع تكرار العملية (Duplicate Transaction Check)
    const existingTx = await adminDb
      .collection("transactions")
      .where("transactionId", "==", transactionId)
      .where("offerwall", "==", wall)
      .get();

    if (!existingTx.empty) {
      return NextResponse.json({ success: false, error: "Duplicate transaction" }, { status: 200 });
    }

    // 4. جلب بيانات المستخدم والتحقق من حالته
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData?.isBanned) {
      return NextResponse.json({ success: false, error: "User is banned" }, { status: 403 });
    }

    // 5. حساب النقاط، المستويات، والمكافآت
    const points = Math.round(payout * USD_TO_POINTS);
    const currentTotalEarned = userData?.totalEarned || 0;
    const currentLevel = userData?.level || 1;
    const nextLevelTarget = currentLevel * 10000; // نظام المستويات: كل 10 آلاف نقطة ليفل جديد
    
    let levelReward = 0;
    let newLevel = currentLevel;

    if ((currentTotalEarned + points) >= nextLevelTarget) {
      newLevel = currentLevel + 1;
      levelReward = 1000; // مكافأة ترقية المستوى (1 دولار)
    }

    // 6. تسجيل العملية في قاعدة البيانات (Transactions)
    await adminDb.collection("transactions").add({
      userId,
      transactionId,
      offerwall: wall,
      offerwallName: config.name,
      offerName,
      payout,
      points,
      fragments: FRAGMENTS_PER_OFFER,
      ip,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
    });

    // 7. تحديث رصيد المستخدم (النقاط، الشظايا، المستوى)
    await userRef.update({
      points: FieldValue.increment(points + levelReward),
      totalEarned: FieldValue.increment(points),
      fragments: FieldValue.increment(FRAGMENTS_PER_OFFER),
      level: newLevel,
    });

    // 8. نظام الإحالة (Referral System - 10%)
    if (userData?.referredBy) {
      const referralBonus = Math.round(points * 0.1);
      const referrerRef = adminDb.collection("users").doc(userData.referredBy);
      const referrerSnap = await referrerRef.get();

      if (referrerSnap.exists && !referrerSnap.data()?.isBanned) {
        await referrerRef.update({
          points: FieldValue.increment(referralBonus),
          totalEarned: FieldValue.increment(referralBonus),
        });

        // سجل أرباح الإحالة
        await adminDb.collection("referral_earnings").add({
          referrerId: userData.referredBy,
          referredUserId: userId,
          earnedPoints: referralBonus,
          sourceTransaction: transactionId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // 9. تحديث إحصائيات النظام (Stats)
    const statsRef = adminDb.collection("stats").doc("offerwalls");
    await statsRef.set({
      [wall]: {
        totalTransactions: FieldValue.increment(1),
        totalPayout: FieldValue.increment(payout),
        totalPoints: FieldValue.increment(points),
      },
      totalTransactions: FieldValue.increment(1),
      totalPayout: FieldValue.increment(payout),
      totalPoints: FieldValue.increment(points),
      lastUpdated: FieldValue.serverTimestamp(),
    }, { merge: true });

    // 10. إرسال إشعار فوري للمستخدم (Notifications)
    await adminDb.collection("notifications").add({
      userId,
      title: "عملية مكتملة",
      message: `كسبت ${points} نقطة و ${FRAGMENTS_PER_OFFER} شظية من ${offerName}.` + (levelReward > 0 ? ` مبروك! وصلت للمستوى ${newLevel}.` : ""),
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

// دعم الـ POST للشركات التي تستخدمه
export async function POST(request: NextRequest) {
  return GET(request);
}
