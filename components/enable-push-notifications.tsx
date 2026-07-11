"use client";

import { useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EnablePushNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const handleEnable = async () => {
    if (!user) {
      toast.error("You must be logged in to enable notifications");
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Your browser does not support notifications");
      return;
    }

    setLoading(true);
    try {
      // Make sure the browser environment supports FCM.
      const supported = await isSupported();
      if (!supported) {
        toast.error("Push notifications are not supported on this device");
        return;
      }

      // Ask the browser for permission.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied");
        return;
      }

      // Register the messaging service worker and generate the token.
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        toast.error("Could not generate a notification token");
        return;
      }

      // Persist the token on the user document.
      await setDoc(doc(db, "users", user.uid), { notificationToken: token }, { merge: true });

      setEnabled(true);
      toast.success("Push notifications enabled!");
    } catch (error: any) {
      console.error("[v0] Push enable error:", error?.message || error);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleEnable}
      disabled={loading || enabled}
      className="w-full h-12 rounded-xl brand-gradient text-white font-bold"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enabling...
        </>
      ) : enabled ? (
        <>
          <Bell className="mr-2 h-5 w-5" /> Notifications Enabled
        </>
      ) : (
        <>
          <Bell className="mr-2 h-5 w-5" /> Enable Push Notifications
        </>
      )}
    </Button>
  );
}
