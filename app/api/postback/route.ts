import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// 1. تهيئة قاعدة البيانات Admin (مع حماية ضد الأخطاء)
function getAdminDb() {
  if (getApps().length === 0) {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error("Missing Firebase Admin Keys in Vercel Environment Variables");
    }

    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

const OFFERWALL_CONFIGS: Record<string, { secretKey: string; name: string }> = {
  test: { secretKey: "123", name: "Test Wall" },
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
};

const USD_TO_POINTS = 1000;

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // جلب البيانات من الرابط (دعم كل المسميات الممكنة)
    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userIdentifier = searchParams.get("user_id") || searchParams.get("uid") || searchParams.get("userId") || searchParams.get("email") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("tid") || `TX-${Date.now()}`;
    const payout = parseFloat(searchParams.get("payout") || searchParams.get("amount") || searchParams.get("reward") || "0");
    const offerName = searchParams.get("offer_name") || searchParams.get("offer") || "Task Completion";

    // التحقق الأساسي
    if (!wall || !userIdentifier) {
      return NextResponse.json({ success: false, error: "Missing Parameters" }, { status: 400 });
    }

    const config = OFFERWALL_CONFIGS[wall];
    if (!config) return NextResponse.json({ success: false, error: "Unknown Wall" }, { status: 400 });

    // 2. البحث عن المستخدم (UID أولاً ثم Email)
    let userRef = adminDb.collection("users").doc(userIdentifier);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const emailQuery = await adminDb.collection("users").where("email", "==", userIdentifier).limit(1).get();
      if (!emailQuery.empty) {
        userRef = emailQuery.docs[0].ref;
        userSnap = emailQuery.docs[0];
      } else {
        // إنشاء مستخدم تلقائي إذا لم يوجد (للتجربة)
        const newUser = await adminDb.collection("users").add({
          email: userIdentifier.includes("@") ? userIdentifier : `${userIdentifier}@mrcash.com`,
          username: userIdentifier.split("@")[0],
          points: 0,
          totalEarned: 0,
          level: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        userRef = adminDb.collection("users").doc(newUser.id);
        userSnap = await userRef.get();
      }
    }

    const userData = userSnap.data();
    const points = Math.round(payout * USD_TO_POINTS) || 100;

    // 3. فحص التكرار (Transaction Deduplication)
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", transactionId).get();
    if (!dupCheck.empty) return NextResponse.json({ success: true, message: "Already Processed" });

    // 4. تنفيذ العمليات (Batch) لضمان الدقة
    const batch = adminDb.batch();

    // أ- إضافة المعاملة
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userSnap.id,
      transactionId,
      offerwall: wall,
      points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // ب- تحديث نقاط المستخدم والمستوى
    const newTotal = (userData?.totalEarned || 0) + points;
    const newLevel = Math.floor(newTotal / 10000) + 1; // كل 10 آلاف نقطة ليفل جديد
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel
    });

    // ج- إضافة للـ Live Feed
    batch.set(adminDb.collection("live_feed").doc(), {
      username: userData?.username || "Guest",
      points,
      source: config.name,
      createdAt: FieldValue.serverTimestamp(),
    });

    // د- تحديث الإحصائيات العامة
    batch.set(adminDb.collection("stats").doc("global"), {
      totalPointsGiven: FieldValue.increment(points),
      totalOffersDone: FieldValue.increment(1),
      lastUpdate: FieldValue.serverTimestamp()
    }, { merge: true });

    // هـ- نظام الإحالة (10%)
    if (userData?.referredBy) {
      const refBonus = Math.round(points * 0.1);
      batch.update(adminDb.collection("users").doc(userData.referredBy), {
        points: FieldValue.increment(refBonus),
        totalEarned: FieldValue.increment(refBonus)
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true, points_added: points, level: newLevel });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
