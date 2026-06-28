"use client";

import { getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

// Public VAPID key is provided via Vercel environment variables.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let messagingInstance: Messaging | null = null;

/**
 * Lazily resolve a Firebase Messaging instance.
 * Returns null when the browser does not support FCM (SSR, iOS Safari < 16.4, etc).
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("[v0] FCM is not supported in this browser.");
      return null;
    }
    messagingInstance = getMessaging(getApp());
    return messagingInstance;
  } catch (err) {
    console.error("[v0] Failed to initialize FCM messaging:", err);
    return null;
  }
}

/**
 * Register the dedicated FCM background service worker.
 */
async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return undefined;
  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (err) {
    console.error("[v0] Failed to register firebase-messaging-sw.js:", err);
    return undefined;
  }
}

/**
 * Request browser notification permission and retrieve the FCM device token.
 * Returns the token string on success, or null otherwise.
 */
export async function requestNotificationPermissionAndToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  if (!VAPID_KEY) {
    console.warn(
      "[v0] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Skipping FCM token retrieval."
    );
    // We can still use native foreground notifications without a token.
    try {
      await Notification.requestPermission();
    } catch {}
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[v0] Notification permission not granted:", permission);
      return null;
    }

    const registration = await registerMessagingServiceWorker();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[v0] FCM token acquired.");
      return token;
    }
    console.log("[v0] No FCM token available.");
    return null;
  } catch (err) {
    console.error("[v0] Error retrieving FCM token:", err);
    return null;
  }
}

/**
 * Subscribe to foreground FCM messages. Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

/**
 * Show a native browser notification (used for foreground / real-time events).
 * Safe to call repeatedly — it silently no-ops without permission.
 */
export function showNativeNotification(title: string, body: string, url = "/") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    // Prefer the service worker registration so notifications behave consistently.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            tag: `mrcash-${Date.now()}`,
            data: { url },
          });
        })
        .catch(() => {
          new Notification(title, { body, icon: "/logo.png" });
        });
    } else {
      new Notification(title, { body, icon: "/logo.png" });
    }
  } catch (err) {
    console.error("[v0] Failed to show native notification:", err);
  }
}
