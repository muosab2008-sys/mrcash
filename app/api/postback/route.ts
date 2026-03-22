import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// دالة التهيئة لضمان عدم حدوث خطأ No App
function initializeAdmin() {
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
  return getFirestore();
}

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

const USD_TO_POINTS = 1000;
const FRAGMENTS_PER_OFFER = 50;

export async function GET(request: NextRequest) {
  try {
    const adminDb = initializeAdmin(); // الاستدعاء داخل الدالة
    const { searchParams } = new URL(request.url);

    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userId = searchParams.get("user_id") || searchParams.get("uid") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || "";
    const payout = parseFloat(searchParams.get("payout") || "0");
    const offerName = searchParams.get("offer_name") || "Unknown Offer";

    if (!wall || !userId || !transactionId || payout <= 0) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const config = OFFERWALL_CONFIGS[wall];
    if (!config) return NextResponse.json({ success: false, error: "Unknown wall" }, { status: 400 });

    const existingTx = await adminDb.collection("transactions").where("transactionId", "==", transactionId).where("offerwall", "==", wall).get();
    if (!existingTx.empty) return NextResponse.json({ success: false, error: "Duplicate" }, { status: 200 });

    const points = Math.round(payout * USD_TO_POINTS);
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    const userData = userSnap.data();

    // حساب الليفل الجديد
    const currentLevel = userData?.level || 1;
    const nextLevelThreshold = currentLevel * 10000;
    let levelReward = 0;
    let newLevel = currentLevel;
    if ((userData?.totalEarned || 0) + points >= nextLevelThreshold) {
      newLevel = currentLevel + 1;
      levelReward = 1000;
    }

    // تنفيذ العملية
    await adminDb.collection("transactions").add({
      userId, transactionId, offerwall: wall, offerwallName: config.name, offerName,
      payout, points, fragments: FRAGMENTS_PER_OFFER, status: "completed", createdAt: FieldValue.serverTimestamp(),
    });

    await userRef.update({
      points: FieldValue.increment(points + levelReward),
      totalEarned: FieldValue.increment(points),
      fragments: FieldValue.increment(FRAGMENTS_PER_OFFER),
      level: newLevel,
    });

    // الإشعارات والإحصائيات
    await adminDb.collection("notifications").add({
      userId, title: "مكافأة!", type: "success", read: false,
      message: `كسبت ${points} نقطة و ${FRAGMENTS_PER_OFFER} شظية.`,
      createdAt: FieldValue.serverTimestamp(),
    });

    const statsRef = adminDb.collection("stats").doc("offerwalls");
    await statsRef.set({
      [wall]: { totalTransactions: FieldValue.increment(1), totalPoints: FieldValue.increment(points) },
      totalPoints: FieldValue.increment(points),
      lastUpdated: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true, points });
  } catch (error) {
    console.error("Postback error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) { return GET(request); }
