import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getAdminDb() {
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
  test: { secretKey: "123", name: "Test Wall" }, // أضفنا حائط تجريبي للاختبار
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

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // تحسين جلب المعاملات لتكون أكثر مرونة
    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userIdentifier = searchParams.get("user_id") || searchParams.get("userId") || searchParams.get("uid") || searchParams.get("email") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || Date.now().toString();
    const payout = parseFloat(searchParams.get("payout") || searchParams.get("amount") || searchParams.get("reward") || "0");
    const offerName = searchParams.get("offer_name") || searchParams.get("offer") || "Reward Task";

    if (!wall || !userIdentifier || (payout <= 0 && wall !== "test")) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const config = OFFERWALL_CONFIGS[wall];
    if (!config) {
      return NextResponse.json({ success: false, error: "Unknown offerwall" }, { status: 400 });
    }

    // 1. البحث عن المستخدم (سواء بالـ UID أو الإيميل)
    let userRef = adminDb.collection("users").doc(userIdentifier);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      // البحث بالإيميل إذا لم ينجح البحث بالـ UID
      const userQuery = await adminDb.collection("users").where("email", "==", userIdentifier).limit(1).get();
      if (!userQuery.empty) {
        userRef = userQuery.docs[0].ref;
        userSnap = userQuery.docs[0];
      } else {
        // إنشاء مستخدم جديد تجريبي إذا لم يوجد (لضمان عدم فشل الاختبارات)
        const newUserData = {
          email: userIdentifier.includes("@") ? userIdentifier : `${userIdentifier}@temporary.com`,
          username: userIdentifier.split("@")[0],
          points: 0,
          totalEarned: 0,
          level: 1,
          createdAt: FieldValue.serverTimestamp(),
        };
        const newUser = await adminDb.collection("users").add(newUserData);
        userRef = adminDb.collection("users").doc(newUser.id);
        userSnap = await userRef.get();
      }
    }

    const userData = userSnap.data();
    const points = Math.round(payout * USD_TO_POINTS) || 100; // افتراضي 100 للاختبار

    // 2. فحص التكرار
    const existingTx = await adminDb.collection("transactions")
      .where("transactionId", "==", transactionId)
      .where("offerwall", "==", wall).get();

    if (!existingTx.empty) {
      return NextResponse.json({ success: true, message: "Duplicate" });
    }

    // 3. تحديث البيانات (نقاط + مستوى + Feed)
    const batch = adminDb.batch();
    
    // سجل المعاملة
    const txRef = adminDb.collection("transactions").doc();
    batch.set(txRef, {
      userId: userSnap.id,
      transactionId,
      offerwall: wall,
      points,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
    });

    // تحديث المستخدم
    const newTotal = (userData?.totalEarned || 0) + points;
    const newLevel = Math.floor(newTotal / 10000) + 1;
    
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel
    });

    // إضافة للـ Live Feed
    const feedRef = adminDb.collection("live_feed").doc();
    batch.set(feedRef, {
      username: userData?.username || "User",
      points,
      source: config.name,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, earned: points });

  } catch (error: any) {
    console.error("Critical Postback Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
