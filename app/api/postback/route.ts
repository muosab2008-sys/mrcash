import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// دالة تهيئة قاعدة البيانات
function getAdminDb() {
  if (getApps().length === 0) {
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDkfPT57bRgONCx
kzsKgx+GWI3jNxjnu9VWpnAL1MSCd++KYs8L3afZlAIuhWCpMd22/xUzvGGtTyCC
U43E+VBI2rQdw1cywGPK73uvhUIeQ3dNqGwyTWlJG4pk0tv9LcpVNOdAFLVk6FJU
vI2i0WX3mu6AUvzVF9WgkGpN+0bZIE09jm+e0uiLGLSNwF97c7L90QlCv1sGqD/H
xUqEVx9eBBJoXEzFtRmGnuGkQL0Z5s4v7YwdJHSfs2nVlZpgHrUqQkX5jnDBbu6O
xJwltRZW9VKn//BL2Ee2RkMMeyuXh+SOdHQLJNG6MmbpW85qLppOdTuTvjis8EL9
sK7GdAOXAgMBAAECggEAKcGwX5CSe1dGxH0cuCIYe8vpOlISah9IsMpABdl/hDx4
+XhvUELU7w1+jJPxg1pKo6vgaxENZMfmMAsnCI1rn7TgX+QYJn1Ef4zetMgMuk0o
G3ghNdwx1puC4kQq0g0xQfsmG+7s66ENktDWrZ/JG8QjvC3uaN8vOmXKF7BJVVqa
cxuGE3bey3DJ0hMwNR1FroCYAFt+PkOx8ONvsqaeBgsuTJG9iqOGqqCNl4JQOej8
Fxg04YDC5jVsx5rJTR4CXMn/cZKjlBsqeABz5DnMPofvdQ/m8rrlPXxcYC+KnGkw
c+VZWHlZkhxVSSLqLmHHk5n4U8eCqihXAL2QdZhR0QKBgQD5C8MnFgBkVTbu6Ggr
Ah/nHdrJJhuLC+x0xRyCSF2s8oljFzXKVIf+Uu0IsrNiu3gUa2Sw3dxRZo2r6iUi
ZOxXxDSNVuc+dPda4/bqR87ESb6AIpIZa4gOzez9QmyECGuXU9jMvXmzJFmJ9j4I
U67+ifzHAGMsB36nLuwhcHnSmQKBgQDq3j4Urj/3/QkCeuUepPEoiYor1CYpVEWW
t2RvnVPeAQJs+fw1Gg2YETwSAvln32aKDv8OjT3Tmsc/EAUhAuKFhcPuotKE2gjY
fSZQnt+ezLla/wUP9BaDJ15iT/KYK6kC+QkxEIXn5miuqg3+JXYZCLp18uxzA8+s
ae7ecqqVrwKBgDuHPTltf+B7oerPMH7/PgLvVul3q2O8EOQEbYESrRl2y7IczSW0
uODoj3HhzREPgG9ZEDNahJwMaFasW/3xo7CC3JDgMdvy92EJVm6/hUPT4K4eFU/w
LRBk1n3ez7Nrk9QTHaIqtBlG2gQpEMDKx+xdrUcf55SRogtyIs0HZocZAoGARTSt
WEyr/repovhxcOErSkWU2CtP/1eclbd+OcFDCCSGAXR7023U2Z0idTA5K1lRjpay
oygNMr/lu/hNepeuBagPvs5td8YDWz8tPg5CWDl82IpShIvo4kaEcjWahyo+R+j3
w2RaAKYM7IKhUuTY8rF2t/CXqaBS3jvsrdFd4HMCgYBKOy4YbAfHJ0idUwiaMmi/
C6BVtY+uONZyc4n6BjGlVtj6vCbZ7kyycxiifJxWayTZpJXw+djyWpq8LgElJKx7
rlDsU+P4WYyCKWCTpU4AKkNlluUVDG6yMseLEcnBo7VFk2VUzoB5ywViGiCi+xag
slmtyUkuZDNy/ESBNJCEjA==
-----END PRIVATE KEY-----`.replace(/\\n/g, '\n');

    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || "mrcash-com",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@mrcash-com.iam.gserviceaccount.com",
      privateKey: privateKey,
    };

    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // 1. تحديد اسم جدار العروض
    const wallParam = searchParams.get("wall") || "Offerwall";
    const wallName = wallParam.charAt(0).toUpperCase() + wallParam.slice(1);

    // 2. تحديد هوية المستخدم (يبحث في كل الاحتمالات)
    const userIdentifier = 
      searchParams.get("user_id") || 
      searchParams.get("ml_sub1") || 
      searchParams.get("subId") ||      
      searchParams.get("subid") ||      
      searchParams.get("uid")   || 
      searchParams.get("email") || 
      "";

    // 3. تحديد رقم المعاملة
    const transactionId = 
      searchParams.get("transaction_id") || 
      searchParams.get("transId") ||    
      searchParams.get("offer_id") || 
      `TX-${Date.now()}`;

    const offerName = searchParams.get("offer_name") || searchParams.get("offerName") || "Task";

    if (!userIdentifier) return new NextResponse("ok", { status: 200 });

    // 4. جلب أو إنشاء المستخدم
    let userRef = adminDb.collection("users").doc(userIdentifier);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      const emailQuery = await adminDb.collection("users").where("email", "==", userIdentifier).limit(1).get();
      if (!emailQuery.empty) {
        userRef = emailQuery.docs[0].ref;
        userSnap = emailQuery.docs[0];
      } else {
        const newUserRef = await adminDb.collection("users").add({
          email: userIdentifier.includes("@") ? userIdentifier : `${userIdentifier}@mrcash.com`,
          username: userIdentifier.split("@")[0],
          points: 0,
          totalEarned: 0,
          level: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        userRef = adminDb.collection("users").doc(newUserRef.id);
        userSnap = await userRef.get();
      }
    }

    const userData = userSnap.data();

    // --- 5. الحسبة المباشرة (نفس الرقم تماماً) ---
    const rawVal = searchParams.get("points") || searchParams.get("payout") || searchParams.get("reward") || searchParams.get("amount") || "0";
    
    // تحويل النص لرقم صحيح فقط (بدون ضرب، بدون شروط)
    // نستخدم Number() لضمان قراءة الرقم كما هو
    let points = Math.floor(Number(rawVal));

    // إذا كان الرقم المدخل غير صالح أو أقل من صفر، نجعله 0
    if (isNaN(points) || points < 0) points = 0;

    // 6. فحص التكرار (لعدم احتساب العرض مرتين)
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", transactionId).get();
    if (!dupCheck.empty) return new NextResponse("ok", { status: 200 });

    const totalEarnedSoFar = (userData?.totalEarned || 0) + points;
    let newLevel = 1;
    if (totalEarnedSoFar >= 100000) newLevel = 4;
    else if (totalEarnedSoFar >= 60000) newLevel = 3;
    else if (totalEarnedSoFar >= 20000) newLevel = 2;
    else newLevel = 1;

    // 7. تنفيذ العملية في قاعدة البيانات
    const batch = adminDb.batch();

    // تسجيل المعاملة
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userSnap.id,
      transactionId,
      offerwall: wallName,
      points: points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // تحديث نقاط المستخدم
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel,
    });

    // إرسال إشعار
    batch.set(adminDb.collection("notifications").doc(), {
      userId: userSnap.id,
      title: "Points Received!",
      message: `You earned ${points} points from ${wallName}.`,
      isRead: false,
      type: "reward",
      createdAt: FieldValue.serverTimestamp(),
    });

    // إضافة للـ Live Feed
    batch.set(adminDb.collection("live_feed").doc(), {
      userId: userSnap.id,
      username: userData?.username || "User",
      points: points,
      source: wallName,
      offerName: offerName,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return new NextResponse("ok", { status: 200 });

  } catch (err: any) {
    console.error("Postback Error:", err.message);
    // نرسل ok للشركة دائماً لمنع إعادة المحاولة المزعجة
    return new NextResponse("ok", { status: 200 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
 
