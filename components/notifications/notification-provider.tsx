"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Gift, Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error" | "withdrawal_approved" | "withdrawal_rejected" | "offer_completed";
  read: boolean;
  points?: number;
  createdAt: Timestamp;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  pushPermission: NotificationPermission | null;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

// Custom toast components for different notification types
function showNotificationToast(notification: Notification) {
  const { type, points } = notification;

  switch (type) {
    case "withdrawal_approved":
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 p-4 bg-card border border-green-500/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Withdrawal Approved</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your withdrawal request has been approved successfully!
              </p>
            </div>
            <button 
              onClick={() => toast.dismiss(t)} 
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ),
        { duration: 6000 }
      );
      break;

    case "withdrawal_rejected":
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 p-4 bg-card border border-red-500/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Withdrawal Rejected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your withdrawal was rejected. Please contact support or check the requirements.
              </p>
            </div>
            <button 
              onClick={() => toast.dismiss(t)} 
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ),
        { duration: 8000 }
      );
      break;

    case "offer_completed":
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 p-4 bg-card border border-primary/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Offer Completed!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Congratulations! You earned <span className="text-primary font-bold">{points?.toLocaleString() || 0}</span> points.
              </p>
            </div>
            <button 
              onClick={() => toast.dismiss(t)} 
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ),
        { duration: 6000 }
      );
      break;

    default:
      // Generic notification
      toast(notification.title, {
        description: notification.message,
      });
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const shownNotifications = useRef<Set<string>>(new Set());

  // Check initial push notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
      
      // Check if we've already asked
      const asked = localStorage.getItem("notification_permission_asked");
      setHasAskedPermission(!!asked);
    }
  }, []);

  // Auto-prompt for notifications on first visit
  useEffect(() => {
    if (
      typeof window !== "undefined" && 
      "Notification" in window && 
      Notification.permission === "default" &&
      !hasAskedPermission
    ) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setHasAskedPermission(true);
        localStorage.setItem("notification_permission_asked", "true");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasAskedPermission]);

  // Listen to user notifications from Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      shownNotifications.current.clear();
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      
      // Show toast for new unread notifications
      notifs.forEach((notif) => {
        if (!notif.read && !shownNotifications.current.has(notif.id)) {
          shownNotifications.current.add(notif.id);
          showNotificationToast(notif);
        }
      });
      
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      localStorage.setItem("notification_permission_asked", "true");
      setHasAskedPermission(true);
      return permission === "granted";
    } catch {
      return false;
    }
  };

  const markAsRead = async (id: string) => {
    const notifRef = doc(db, "notifications", id);
    await updateDoc(notifRef, { read: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        pushPermission,
        requestPushPermission,
      }}
    >
      {children}
      
      {/* Push notification prompt */}
      {!hasAskedPermission && pushPermission === "default" && (
        <NotificationPrompt onClose={() => setHasAskedPermission(true)} />
      )}
    </NotificationContext.Provider>
  );
}

function NotificationPrompt({ onClose }: { onClose: () => void }) {
  const { requestPushPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleAllow = async () => {
    await requestPushPermission();
    localStorage.setItem("notification_permission_asked", "true");
    onClose();
  };

  const handleDeny = () => {
    localStorage.setItem("notification_permission_asked", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          {/* Bell icon with animation */}
          <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center mb-4 animate-pulse">
            <Bell className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">
            Enable Notifications
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Get notified about new offers, rewards, and when your withdrawal is processed!
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDeny}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors font-medium"
            >
              Not Now
            </button>
            <button
              onClick={handleAllow}
              className="flex-1 px-4 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-opacity"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
