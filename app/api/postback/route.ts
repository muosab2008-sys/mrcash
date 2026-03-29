import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
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

    // --- 1. البحث المرن عن المعرف (User ID) ---
    const userKeys = ["user_id", "s1", "sub1", "uid", "subId", "click_id", "external_id"];
    let userId = "";
    for (const key of userKeys) {
      if (searchParams.get(key)) {
        userId = searchParams.get(key) || "";
        break;
      }
    }

    if (!userId) return new NextResponse("ok", { status: 200 });

    // --- 2. البحث المرن عن المبلغ (Amount/Value) ---
    const valueKeys = ["amount", "value", "payout", "points", "reward", "payout_usd"];
    let rawValue = "0";
    for (const key of valueKeys) {
      if (searchParams.get(key)) {
        rawValue = searchParams.get(key) || "0";
        break;
      }
    }

    // الضرب في 500
    let points = parseFloat(rawValue) * 500;
    if (isNaN(points) || points <= 0) return new NextResponse("ok", { status: 200 });

    // --- 3. البحث المرن عن اسم العرض والشركة ---
    const wallName = searchParams.get("wall") || searchParams.get("source") || "Offerwall";
    const offerName = searchParams.get("offer_name") || searchParams.get("off_name") || searchParams.get("ad_name") || "Task";

    // --- 4. المعرف الفريد لمنع التكرار (Transaction ID) ---
    const txId = searchParams.get("signature") || searchParams.get("token") || searchParams.get("txid") || searchParams.get("transaction_id") || `AUTO-${Date.now()}`;

    // --- 5. العمليات على قاعدة البيانات ---
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    // إنشاء المستخدم إذا لم يكن موجوداً
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

    // فحص التكرار
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", txId).limit(1).get();
    if (!dupCheck.empty) return new NextResponse("ok", { status: 200 });

    const batch = adminDb.batch();

    // تحديث النقاط والرصيد
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
    });

    // تسجيل العملية
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userId,
      transactionId: txId,
      offerwall: wallName,
      offerName: offerName,
      points: points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // إرسال إشعار
    batch.set(adminDb.collection("notifications").doc(), {
      userId: userId,
      title: "Reward Added!",
      message: `You earned ${points.toFixed(2)} points from ${offerName}.`,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // إضافة لآخر العمليات (Live Feed)
    batch.set(adminDb.collection("live_feed").doc(), {
      userId: userId,
      username: userId.includes("@") ? userId.split("@")[0] : "User",
      points: points,
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
