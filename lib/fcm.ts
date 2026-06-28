"use client";

import { getToken, deleteToken } from "firebase/messaging";
import { doc, setDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, getMessagingInstance } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Registers the firebase-messaging service worker. Returns the registration
 * or null when service workers / the SW file are unavailable.
 */
async function getMessagingRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (error) {
    console.error("[v0] firebase-messaging-sw registration failed:", error);
    return null;
  }
}

/**
 * Requests an FCM web-push token and stores it on the user's document so the
 * server (offerwall callback) can send background push notifications.
 *
 * Gracefully no-ops if the VAPID key is missing or push is unsupported.
 */
export async function registerFcmToken(uid: string): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn("[v0] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping FCM token registration.");
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const registration = await getMessagingRegistration();
  if (!registration) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // Store token in an array so a user can receive push on multiple devices.
    await setDoc(
      doc(db, "users", uid),
      {
        fcmTokens: arrayUnion(token),
        fcmUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.error("[v0] Failed to get FCM token:", error);
    return null;
  }
}

/**
 * Removes the current device's token (e.g. on logout or when the user
 * disables notifications).
 */
export async function unregisterFcmToken(uid: string): Promise<void> {
  const messaging = await getMessagingInstance();
  if (!messaging || !VAPID_KEY) return;

  try {
    const registration = await getMessagingRegistration();
    if (!registration) return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await setDoc(doc(db, "users", uid), { fcmTokens: arrayRemove(token) }, { merge: true });
      await deleteToken(messaging);
    }
  } catch (error) {
    console.error("[v0] Failed to unregister FCM token:", error);
  }
}
