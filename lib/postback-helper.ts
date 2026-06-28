import { adminDb, adminApp } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import admin from "firebase-admin";

/**
 * Shape of the data every offerwall route passes in once an offer
 * has been securely validated (signature / IP / secret-key checks).
 */
export interface PostbackInput {
  /** Firestore user document ID OR a username/email used to look the user up. */
  userIdentifier: string;
  /** Reward amount in MrCash points (decimals allowed). */
  points: number;
  /** Human-readable offer title, e.g. "Monkey Hop - Complete Level 10". */
  offerName: string;
  /** Name of the offerwall, e.g. "PubScale", "GemiAd". */
  source: string;
  /**
   * Unique transaction id used for deduplication. Strongly recommended:
   * pass the offerwall's own token/tid so the same offer is never paid twice.
   */
  transactionId: string;
  /** Optional raw USD payout, stored for analytics. */
  payoutUsd?: number;
}

export interface PostbackResult {
  success: boolean;
  status: number;
  userId?: string;
  message: string;
  alreadyProcessed?: boolean;
}

/**
 * Look up a user by document ID first, then by `username`, then by `email`.
 */
async function findUser(identifier: string) {
  const byId = await adminDb.collection("users").doc(identifier).get();
  if (byId.exists) return { id: byId.id, data: byId.data()! };

  const byUsername = await adminDb
    .collection("users")
    .where("username", "==", identifier)
    .limit(1)
    .get();
  if (!byUsername.empty) {
    const d = byUsername.docs[0];
    return { id: d.id, data: d.data()! };
  }

  const byEmail = await adminDb
    .collection("users")
    .where("email", "==", identifier)
    .limit(1)
    .get();
  if (!byEmail.empty) {
    const d = byEmail.docs[0];
    return { id: d.id, data: d.data()! };
  }

  return null;
}

/**
 * Send the FCM web-push to every device token registered on the user doc.
 * Cleans up any tokens Firebase reports as invalid/expired.
 */
async function sendPushNotification(
  userId: string,
  tokens: string[],
  points: number,
  offerName: string
) {
  if (!tokens || tokens.length === 0) return;

  const title = "Points Credited!";
  const body = `Your account has been credited with +${points} points for completing ${offerName}`;

  try {
    const messaging = getMessaging(adminApp);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/logo.png",
        },
        fcmOptions: { link: "/" },
      },
      data: {
        type: "offer_credit",
        points: String(points),
        offerName,
        url: "/",
      },
    });

    // Prune dead tokens so the array stays healthy.
    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await adminDb
        .collection("users")
        .doc(userId)
        .update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        });
    }
  } catch (err) {
    // Push failures must never break the credit flow.
    console.error("[Postback] FCM push error:", err);
  }
}

/**
 * Reusable, atomic offer-credit handler shared by every postback route.
 *
 * It performs, in a single Firestore transaction:
 *   1. Looks the user up + reads their custom avatar (photoURL).
 *   2. Credits all balance fields and blocks duplicate transactions.
 *   3. Writes the `live_feed` doc with the exact required schema.
 *   4. Writes an in-app `notifications` doc (drives the bell + toast).
 * Then, after the transaction commits, it fires the FCM web push.
 */
export async function handleSuccessfulPostback(
  input: PostbackInput
): Promise<PostbackResult> {
  const { userIdentifier, points, offerName, source, transactionId, payoutUsd } =
    input;

  if (!userIdentifier || !transactionId) {
    return { success: false, status: 400, message: "Missing user or transaction id" };
  }
  if (!Number.isFinite(points) || points <= 0) {
    return { success: false, status: 400, message: "Invalid reward value" };
  }

  // Resolve the real user before opening the transaction.
  const user = await findUser(userIdentifier);
  if (!user) {
    return { success: false, status: 404, message: "User not found" };
  }
  if (user.data.isBanned) {
    return { success: false, status: 403, message: "User is banned" };
  }

  const userId = user.id;
  const username =
    user.data.username || user.data.displayName || userIdentifier;
  // Custom avatar selected by the user from the internal avatar pool.
  const photoURL: string = user.data.photoURL || user.data.avatarUrl || "";

  const userRef = adminDb.collection("users").doc(userId);
  const transactionRef = adminDb.collection("transactions").doc(transactionId);
  const liveFeedRef = adminDb.collection("live_feed").doc();
  const notificationRef = adminDb.collection("notifications").doc();

  try {
    await adminDb.runTransaction(async (ts) => {
      // Deduplicate: bail out if this exact transaction was already paid.
      const existing = await ts.get(transactionRef);
      if (existing.exists) {
        throw new Error("ALREADY_PROCESSED");
      }

      const snap = await ts.get(userRef);
      const data = snap.data() || {};
      const current = {
        points: data.points || 0,
        balance: data.balance || 0,
        mc: data.MC || data.mc || 0,
        totalEarned: data.totalEarned || 0,
        xp: data.xp || 0,
      };

      // 1) Credit every currency field the UI reads.
      ts.update(userRef, {
        points: current.points + points,
        balance: current.balance + points,
        MC: current.mc + points,
        mc: current.mc + points,
        totalEarned: current.totalEarned + points,
        xp: current.xp + points,
      });

      // 2) Record the transaction (also our dedup marker).
      ts.set(transactionRef, {
        userId,
        username,
        amount: points,
        points,
        payoutUsd: payoutUsd ?? 0,
        type: "offer_credit",
        offerName,
        source,
        status: "completed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3) Live feed entry — EXACT schema required by the feed UI.
      ts.set(liveFeedRef, {
        userId,
        username,
        points,
        offerName,
        source,
        photoURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4) In-app notification (bell + real-time toast).
      ts.set(notificationRef, {
        userId,
        title: "Points Credited!",
        message: `Your account has been credited with +${points} points for completing ${offerName}`,
        type: "offer_credit",
        points,
        source,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err: any) {
    if (err?.message === "ALREADY_PROCESSED") {
      return {
        success: false,
        status: 200,
        message: "Transaction already processed",
        alreadyProcessed: true,
      };
    }
    console.error("[Postback] Transaction failed:", err);
    return { success: false, status: 500, message: "Internal Server Error" };
  }

  // 5) Fire the FCM web push (outside the transaction — never blocks the credit).
  const tokens: string[] = Array.isArray(user.data.fcmTokens)
    ? user.data.fcmTokens.filter(Boolean)
    : [];
  await sendPushNotification(userId, tokens, points, offerName);

  return {
    success: true,
    status: 200,
    userId,
    message: `Credited +${points} points to ${username}`,
  };
}
