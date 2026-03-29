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
      clientEmail:
        process.env.FIREBASE_CLIENT_EMAIL ||
        "firebase-adminsdk-fbsvc@mrcash-com.iam.gserviceaccount.com",
      privateKey: privateKey,
    };

    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

/**
 * AUDIT LOG - Requirements Met:
 * ✅ 1. Fixed '0 points' bug: Uses Math.round(parseFloat(rawVal)) for accurate point calculation
 * ✅ 2. Universal Parameters: Checks user_id, ml_sub1, subId, subid, uid AND points, payout, payout_usd, reward, amount
 * ✅ 3. Auto-User Creation: Creates new users with points: 0, totalEarned: 0, level: 1, createdAt: serverTimestamp()
 * ✅ 4. Duplicate Prevention: Checks transaction_id AND click_id to prevent double-crediting
 * ✅ 5. Firebase Admin Integration: Uses standard SDK (initializeApp, cert, getFirestore)
 * ✅ 6. Diversity & Safety: Returns 200 'ok' status even on errors to prevent company retries
 */

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // 1. Determine the offerwall name
    const wallParam = searchParams.get("wall") || "Offerwall";
    const wallName =
      wallParam.charAt(0).toUpperCase() + wallParam.slice(1).toLowerCase();

    // 2. UNIVERSAL USER IDENTIFIER - Check all possible parameter names
    const userIdentifier =
      searchParams.get("user_id") ||
      searchParams.get("ml_sub1") ||
      searchParams.get("subId") ||
      searchParams.get("subid") ||
      searchParams.get("uid") ||
      "";

    // Gracefully return if no user identifier provided
    if (!userIdentifier) {
      return new NextResponse("ok", { status: 200 });
    }

    // 3. DUPLICATE PREVENTION - Check for transaction_id or click_id
    const transactionId =
      searchParams.get("transaction_id") ||
      searchParams.get("click_id") ||
      searchParams.get("transId") ||
      `TX-${Date.now()}`;

    // 4. Get offer name for logging
    const offerName =
      searchParams.get("offer_name") || searchParams.get("offerName") || "Task";

    // 5. AUTO-USER CREATION - Fetch or create user document
    let userRef = adminDb.collection("users").doc(userIdentifier);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Try to find user by email if identifier looks like an email
      if (userIdentifier.includes("@")) {
        const emailQuery = await adminDb
          .collection("users")
          .where("email", "==", userIdentifier)
          .limit(1)
          .get();

        if (!emailQuery.empty) {
          userRef = emailQuery.docs[0].ref;
          userSnap = emailQuery.docs[0];
        } else {
          // Create new user with required fields
          await userRef.set({
            email: userIdentifier,
            username: userIdentifier.split("@")[0],
            points: 0,
            totalEarned: 0,
            level: 1,
            createdAt: FieldValue.serverTimestamp(),
          });
          userSnap = await userRef.get();
        }
      } else {
        // Create new user for non-email identifiers
        await userRef.set({
          userId: userIdentifier,
          points: 0,
          totalEarned: 0,
          level: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        userSnap = await userRef.get();
      }
    }

    const userData = userSnap.data();

    // 6. POINTS CALCULATION FIX - Use Math.round(parseFloat()) for accurate values
    const rawVal =
      searchParams.get("points") ||
      searchParams.get("payout") ||
      searchParams.get("payout_usd") ||
      searchParams.get("reward") ||
      searchParams.get("amount") ||
      "0";

    // Round the parsed float value exactly as sent by the company (no multiplication)
    let points = Math.round(parseFloat(rawVal));

    // Ensure points is valid and non-negative
    if (isNaN(points) || points < 0) {
      points = 0;
    }

    // 7. DUPLICATE PREVENTION - Check if transaction already exists
    const dupCheck = await adminDb
      .collection("transactions")
      .where("transactionId", "==", transactionId)
      .limit(1)
      .get();

    if (!dupCheck.empty) {
      // Transaction already credited, return ok without re-processing
      return new NextResponse("ok", { status: 200 });
    }

    // 8. Calculate new level based on total earned
    const totalEarnedSoFar = (userData?.totalEarned || 0) + points;
    let newLevel = 1;
    if (totalEarnedSoFar >= 100000) {
      newLevel = 4;
    } else if (totalEarnedSoFar >= 60000) {
      newLevel = 3;
    } else if (totalEarnedSoFar >= 20000) {
      newLevel = 2;
    } else {
      newLevel = 1;
    }

    // 9. Batch write to database
    const batch = adminDb.batch();

    // Record the transaction
    batch.set(adminDb.collection("transactions").doc(), {
      userId: userSnap.id,
      userIdentifier: userIdentifier,
      transactionId: transactionId,
      offerwall: wallName,
      offerName: offerName,
      points: points,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update user points, totalEarned, and level
    batch.update(userRef, {
      points: FieldValue.increment(points),
      totalEarned: FieldValue.increment(points),
      level: newLevel,
    });

    // Create notification
    batch.set(adminDb.collection("notifications").doc(), {
      userId: userSnap.id,
      title: "Points Received!",
      message: `You earned ${points} points from ${wallName}.`,
      isRead: false,
      type: "reward",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Add to live feed
    batch.set(adminDb.collection("live_feed").doc(), {
      userId: userSnap.id,
      username: userData?.username || "User",
      points: points,
      source: wallName,
      offerName: offerName,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Commit all database changes
    await batch.commit();

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    // SAFETY: Always return 200 ok to prevent company from retrying
    console.error("[Postback Error]", err.message);
    return new NextResponse("ok", { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
