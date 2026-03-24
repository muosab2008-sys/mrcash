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

const POINTS_PER_DOLLAR = 1000;

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // استخراج اسم الشركة ديناميكياً من الرابط
    const wallParam = searchParams.get("wall") || "Offerwall";
    const wallName = wallParam.charAt(0).toUpperCase() + wallParam.slice(1);

   const userIdentifier = 
      searchParams.get("user_id") || 
      searchParams.get("ml_sub1") || 
      searchParams.get("subId") ||     // خاص بـ BagiraWall
      searchParams.get("subid") ||     // خاص بـ Growdeck
      searchParams.get("uid")   || 
      searchParams.get("email") || 
      "";

    const offerName = 
      searchParams.get("offer_name") || 
      searchParams.get("offerName") || 
      "Special Task";

    const transactionId = 
      searchParams.get("transaction_id") || 
      searchParams.get("transId") ||    // خاص بـ BagiraWall
      searchParams.get("offer_id") || 
      `TX-${Date.now()}`;
const userData = userSnap.data();
 const rawPayout = searchParams.get("payout") || searchParams.get("reward") || "0";
  const payoutValue = parseFloat(rawPayout);
  
  // نأخذ الرقم من الشركة مباشرة (مثلاً 5 نقاط تصل 5 نقاط)
  let points = Math.round(payoutValue); 
  if (points <= 0) points = 5;
    // حساب الليفل التصاعدي
    const totalEarnedSoFar = (userData?.totalEarned || 0) + points;
    let newLevel = 1;
    if (totalEarnedSoFar >= 100000) newLevel = 4;
    else if (totalEarnedSoFar >= 60000) newLevel = 3;
    else if (totalEarnedSoFar >= 20000) newLevel = 2;
    else newLevel = 1;
    if (!userIdentifier) {
     return new NextResponse("ok", { status: 200 });
    }

    // البحث عن المستخدم أو إنشاؤه
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
    
    // 1. حساب النقاط القادمة من الشركة (حل مشكلة التدبيل)
    const rawPayout = searchParams.get("payout") || searchParams.get("reward") || "0";
    const payoutValue = parseFloat(rawPayout);
    
    // التعديل: نأخذ القيمة كما هي لأن الشركة ترسل نقاطاً وليس دولارات
    let points = Math.round(payoutValue); 
    if (points <= 0) points = 5; // حد أدنى للأمان

    // 2. حساب الليفل التصاعدي (يعتمد على إجمالي النقاط المكتسبة)
    const totalEarnedSoFar = (userData?.totalEarned || 0) + points;
    let newLevel = 1;
    if (totalEarnedSoFar >= 100000) newLevel = 4;
    else if (totalEarnedSoFar >= 60000) newLevel = 3;
    else if (totalEarnedSoFar >= 20000) newLevel = 2;
    else newLevel = 1;

    // 3. تحديث قاعدة البيانات (مسح الشظايا وتحديث الليفل والنقاط)
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel, // تحديث الليفل بناءً على المجموع الجديد
      // ملاحظة: لم نضف حقل fragments هنا، سيتم تجاهله ولن يرسل شظايا
    });
    // فحص التكرار
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", transactionId).get();
   if (!dupCheck.empty) return new NextResponse("ok", { status: 200 });

    const batch = adminDb.batch();

    // 1. تسجيل المعاملة
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userSnap.id,
      transactionId,
      offerwall: wallName,
      points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. تحديث النقاط والليفل
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel, // تحديث الليفل بناءً على النقاط
    });

    // 3. إضافة الإشعار (English Only)
    batch.set(adminDb.collection("notifications").doc(), {
      userId: userSnap.id,
      title: "New Points Added! 💰",
      message: `Congratulations! ${points} points have been added to your balance from ${wallName}.`,
      isRead: false,
      type: "reward",
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. تحديث الـ Live Feed (التعديل المطلوب للبيانات الحقيقية)
batch.set(adminDb.collection("live_feed").doc(), {
  userId: userSnap.id,           // أضفنا الـ ID الحقيقي لفتح البروفايل
  username: userData?.username || "User",
  photoURL: userData?.photoURL || "", // أضفنا سحب الصورة الشخصية
  points: points,
  source: wallName,
  offerName: offerName || "Task", // أضفنا اسم العرض الحقيقي
  createdAt: FieldValue.serverTimestamp(),
});

    await batch.commit();
    return new NextResponse("ok", { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
