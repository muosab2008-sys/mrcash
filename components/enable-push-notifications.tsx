"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type PermState = "default" | "granted" | "denied" | "unsupported";

export function EnablePushNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [perm, setPerm] = useState<PermState>("default");

  // Detect the current notification permission when the component mounts.
  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        if (active) setPerm("unsupported");
        return;
      }
      try {
        const supported = await isSupported();
        if (!supported) {
          if (active) setPerm("unsupported");
          return;
        }
      } catch {
        if (active) setPerm("unsupported");
        return;
      }
      if (active) setPerm(Notification.permission as PermState);
    })();
    return () => {
      active = false;
    };
  }, []);

  const registerToken = async () => {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) throw new Error("no-token");
    await setDoc(doc(db, "users", user!.uid), { notificationToken: token }, { merge: true });
    return token;
  };

  const handleEnable = async () => {
    if (!user) {
      toast.error("You must be logged in to enable notifications");
      return;
    }
    if (perm === "unsupported") {
      toast.error("Push notifications are not supported on this device");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPerm(permission as PermState);

      if (permission === "denied") {
        toast.error("Notifications are blocked. Please allow them from your browser settings.");
        return;
      }
      if (permission !== "granted") {
        toast.error("Notification permission was not granted");
        return;
      }

      await registerToken();
      toast.success("Push notifications enabled!");
    } catch (error: any) {
      console.error("[v0] Push enable error:", error?.message || error);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  // Re-sync the token even if permission is already granted (re-enable flow).
  const handleReenable = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await registerToken();
      toast.success("Notifications re-activated on this device");
    } catch (error: any) {
      console.error("[v0] Push re-enable error:", error?.message || error);
      toast.error("Failed to re-activate notifications");
    } finally {
      setLoading(false);
    }
  };

  if (perm === "unsupported") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
        <BellOff className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported on this device or browser.
        </p>
      </div>
    );
  }

  if (perm === "denied") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-500/90">
            Notifications are blocked. To turn them back on, open your browser&apos;s site
            settings for this page and set Notifications to &quot;Allow&quot;, then reload.
          </p>
        </div>
        <Button
          onClick={handleEnable}
          disabled={loading}
          variant="outline"
          className="w-full h-12 rounded-xl font-bold"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bell className="mr-2 h-5 w-5" />}
          Try Again
        </Button>
      </div>
    );
  }

  if (perm === "granted") {
    return (
      <Button
        onClick={handleReenable}
        disabled={loading}
        className="w-full h-12 rounded-xl brand-gradient text-white font-bold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Re-activating...
          </>
        ) : (
          <>
            <BellRing className="mr-2 h-5 w-5" /> Notifications On &middot; Re-activate
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleEnable}
      disabled={loading}
      className="w-full h-12 rounded-xl brand-gradient text-white font-bold"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enabling...
        </>
      ) : (
        <>
          <Bell className="mr-2 h-5 w-5" /> Enable Push Notifications
        </>
      )}
    </Button>
  );
}
