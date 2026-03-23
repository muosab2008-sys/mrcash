import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// دالة تهيئة قاعدة البيانات مع معالجة ذكية للمفتاح السري
function getAdminDb() {
  if (getApps().length === 0) {
    // المفتاح السري الذي أرسلته (قمنا بمعالجته ليكون متوافقاً مع السيرفر)
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

const OFFERWALL_CONFIGS: Record<string, { secretKey: string; name: string }> = {
  test: { secretKey: "123", name: "Test Wall" },
  lootably: { secretKey: process.env.LOOTABLY_SECRET || "", name: "Lootably" },
  offertoro: { secretKey: process.env.OFFERTORO_SECRET || "", name: "OfferToro" },
};

const USD_TO_POINTS = 1000;

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    const wall = searchParams.get("wall")?.toLowerCase() || "";
    const userIdentifier = searchParams.get("user_id") || searchParams.get("uid") || searchParams.get("email") || "";
    const transactionId = searchParams.get("transaction_id") || `TX-${Date.now()}`;
    const payout = parseFloat(searchParams.get("payout") || "0");

    if (!wall || !userIdentifier) {
      return NextResponse.json({ success: false, error: "Missing Parameters" }, { status: 400 });
    }

    const config = OFFERWALL_CONFIGS[wall];
    if (!config) return NextResponse.json({ success: false, error: "Unknown Wall" }, { status: 400 });

    // البحث عن المستخدم
    let userRef = adminDb.collection("users").doc(userIdentifier);
    let userSnap = await userRef.get();

    // إذا لم يوجد، نبحث بالإيميل
    if (!userSnap.exists) {
      const emailQuery = await adminDb.collection("users").where("email", "==", userIdentifier).limit(1).get();
      if (!emailQuery.empty) {
        userRef = emailQuery.docs[0].ref;
        userSnap = emailQuery.docs[0];
      } else {
        // إنشاء مستخدم جديد للتجربة
        const newUserRef = await adminDb.collection("users").add({
          email: userIdentifier.includes("@") ? userIdentifier : `${userIdentifier}@mrcash.com`,
          username: userIdentifier.split("@")[0],
          points: 0,
          totalEarned: 0,
          level: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        userRef = newUserRef;
        userSnap = await userRef.get();
      }
    }

    const userData = userSnap.data();
    const points = Math.round(payout * USD_TO_POINTS) || 100;

    // فحص التكرار
    const dupCheck = await adminDb.collection("transactions").where("transactionId", "==", transactionId).get();
    if (!dupCheck.empty) return NextResponse.json({ success: true, message: "Already Processed" });

    const batch = adminDb.batch();

    // تسجيل المعاملة
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userSnap.id,
      transactionId,
      offerwall: wall,
      points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // تحديث النقاط والمستوى
    const newTotal = (userData?.totalEarned || 0) + points;
    const newLevel = Math.floor(newTotal / 10000) + 1;
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel
    });

    // تحديث الـ Live Feed
    batch.set(adminDb.collection("live_feed").doc(), {
      username: userData?.username || "User",
      points,
      source: config.name,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return NextResponse.json({ success: true, points_added: points, level: newLevel });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
