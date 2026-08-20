import { useState } from "react";
import { Icon } from "./Icon";
import { useNotifications } from "../lib/NotificationsContext";

export function NotificationsBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg hover:bg-white/5 text-white/70"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto card-frame z-40 p-2" style={{ ["--frame-color" as string]: "#a86a1c" }}>
            <p className="font-display text-sm font-semibold px-2 py-2 text-white/80">Notificaciones</p>
            {notifications.length === 0 ? (
              <p className="text-xs text-white/40 px-2 py-4 text-center">Sin notificaciones todavía.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-2 py-2.5 rounded-lg text-sm ${n.read ? "text-white/50" : "text-white/90 bg-arcane-500/10"}`}>
                  {n.message}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
