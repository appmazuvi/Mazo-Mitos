import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { getSocket } from "./socket";
import { useAuth } from "./AuthContext";
import type { NotificationItem } from "../types";

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  unreadMessages: number;
  markAllRead: () => Promise<void>;
  bumpUnreadMessages: (delta: number) => void;
  clearUnreadMessages: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get<NotificationItem[]>("/api/notifications").then(setNotifications);
    api.get<{ unread: number }[]>("/api/messages").then((convos: any) => {
      const total = convos.reduce((s: number, c: any) => s + c.unread, 0);
      setUnreadMessages(total);
    });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const onNotification = (n: { type: string; message: string }) => {
      setNotifications((prev) => [
        { id: `live-${Date.now()}`, type: n.type, message: n.message, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    };
    const onMessage = () => setUnreadMessages((c) => c + 1);
    socket.on("notification:new", onNotification);
    socket.on("message:new", onMessage);
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("message:new", onMessage);
    };
  }, [token]);

  async function markAllRead() {
    await api.post("/api/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        unreadMessages,
        markAllRead,
        bumpUnreadMessages: (delta) => setUnreadMessages((c) => Math.max(0, c + delta)),
        clearUnreadMessages: () => setUnreadMessages(0),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  return ctx;
}
