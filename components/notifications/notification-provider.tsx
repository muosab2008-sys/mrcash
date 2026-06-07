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
  // 🔥 تعديل الأنواع لتشمل الـ offer_credit و chargeback القادمة من السيرفر
  type: "success" | "info" | "warning" | "error" | "withdrawal_approved" | "withdrawal_rejected" | "offer_completed" | "offer_credit" | "chargeback";
  read: boolean;
  points?: number;
  amount?: number; // الحقل المالي المستخدم في كود السيرفر
  createdAt?: Timestamp;
  timestamp?: Timestamp; // الحقل الزمني المستخدم في كود السيرفر
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

// مكونات التوست المخصصة الذكية
function showNotificationToast(notification: Notification) {
  const { type, points, amount, message } = notification;
  // جلب رصيد النقاط الحقيقي سواء كان مخزناً بـ points أو amount
  const displayPoints = points || amount || 0;

  switch (type) {
    case "withdrawal_approved":
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 p-4 bg-card border border-green-500/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2" style={{ direction: 'rtl' }}>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-foreground text-sm">تم قبول طلب السحب! 🎉</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                تهانينا، تم معالجة وإرسال دفعتك بنجاح.
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
          <div className="flex items-center gap-3 p-4 bg-card border border-red-500/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2" style={{ direction: 'rtl' }}>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-foreground text-sm">تم رفض طلب السحب ⚠️</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                الرجاء مراجعة الدعم الفني أو التأكد من شروط السحب.
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

    // 🔥 دمج كود المعاملات الحية والـ offer_credit لتعرض التوست الملون الاحترافي فوراً عند شحن البوست باك
    case "offer_completed":
    case "offer_credit":
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 p-4 bg-card border border-primary/30 rounded-xl shadow-lg max-w-md animate-in slide-in-from-top-2" style={{ direction: 'rtl' }}>
            <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-foreground text-sm">🎉 كسبت نقاطاً جديدة!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                مبروك! تم إضافة <span className="text-primary font-bold text-blue-500">+{displayPoints.toLocaleString()}</span> نقطة إلى محفظتك.
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
      // التنبيه العادي الافتراضي لبقية الأنواع
      toast(notification.title, {
        description: message || notification.message,
      });
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const shownNotifications = useRef<Set<string>>(new Set());

  // التحقق من صلاحيات المتصفح للإشعارات المنبثقة
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
      const asked = localStorage.getItem("notification_permission_asked");
      setHasAskedPermission(!!asked);
    }
  }, []);

  // توقيت إظهار طلب تفعيل الإشعارات للمشترك الجديد
  useEffect(() => {
    if (
      typeof window !== "undefined" && 
      "Notification" in window && 
      Notification.permission === "default" &&
      !hasAskedPermission
    ) {
      const timer = setTimeout(() => {
        setHasAskedPermission(true);
        localStorage.setItem("notification_permission_asked", "true");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasAskedPermission]);

  // 🔥 الاستماع اللحظي الفولاذي لـ Firestore المرتب بحقل الوقت timestamp السليم
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      shownNotifications.current.clear();
      return;
    }

    const notificationsRef = collection(db, "notifications");
    
    // الاستعلام المحدث ليرتب بحقل الـ timestamp المتوافق مع كود السيرفر
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      
      // إطلاق توست التنبيه الفوري للمستخدم عند نزول إشعار جديد غير مقروء
      notifs.forEach((notif) => {
        if (!notif.read && !shownNotifications.current.has(notif.id)) {
          shownNotifications.current.add(notif.id);
          showNotificationToast(notif);
        }
      });
      
      setNotifications(notifs);
    }, (error) => {
      console.error("Firestore Listen Notification Error:", error.message);
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
      
      {/* نافذة منبثقة لطلب إذن الإشعارات من المستخدم */}
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-4 animate-pulse">
            <Bell className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">
            تفعيل الإشعارات الفورية
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            احصل على تنبيهات فورية عند إكمال العروض، كسب النقاط، ومتابعة حالة طلبات السحب الخاصة بك!
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDeny}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors font-medium"
            >
              ليس الآن
            </button>
            <button
              onClick={handleAllow}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              سماح
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
