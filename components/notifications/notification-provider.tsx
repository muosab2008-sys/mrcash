"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
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
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const shownIds = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) setPushPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const client = createClient();
    if (!client || !user) {
      setNotifications([]);
      shownIds.current.clear();
      return;
    }

    let active = true;
    const load = async () => {
      const { data } = await client
        .from("notifications")
        .select("id,title,message,type,read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (active) setNotifications((data ?? []).map((item) => ({ ...item, createdAt: item.created_at })) as Notification[]);
    };
    void load();

    const channel = client
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, ({ new: item }) => {
        const notification = { ...item, createdAt: item.created_at } as Notification;
        setNotifications((current) => [notification, ...current].slice(0, 50));
        if (shownIds.current.has(notification.id)) return;
        shownIds.current.add(notification.id);
        toast(notification.title, { description: notification.message });
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          new Notification(notification.title, { body: notification.message });
        }
      })
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user]);

  const requestPushPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    return permission === "granted";
  };

  const markAsRead = async (id: string) => {
    const client = createClient();
    if (!client || !user) return;
    await client.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAllAsRead = async () => {
    const client = createClient();
    if (!client || !user) return;
    await client.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount: notifications.filter((item) => !item.read).length, markAsRead, markAllAsRead, pushPermission, requestPushPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}
