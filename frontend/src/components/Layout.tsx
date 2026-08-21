import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationsContext";
import { API_URL } from "../lib/api";
import { Icon } from "./Icon";
import { NotificationsBell } from "./NotificationsBell";

const navItems = [
  { to: "/", label: "Inicio", icon: "home" as const, end: true },
  { to: "/explorar", label: "Explorar", icon: "search" as const },
  { to: "/buscar", label: "Buscar", icon: "trophy" as const },
  { to: "/cartas", label: "Cartas", icon: "layers" as const },
  { to: "/mazos", label: "Mazos", icon: "deck" as const },
  { to: "/batalla", label: "Batalla", icon: "swords" as const },
  { to: "/mensajes", label: "Mensajes", icon: "message" as const },
  { to: "/grupos", label: "Grupos", icon: "users" as const },
];

// Accesos rápidos de la barra inferior en mobile: el resto de las páginas
// (Explorar, Grupos, Manual, Perfil, Cerrar sesión) vive en el menú ☰.
const mobileItems = [navItems[0], navItems[3], navItems[4], navItems[5], navItems[6]];

export function Layout() {
  const { user, logout } = useAuth();
  const { unreadMessages } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside className="w-64 shrink-0 border-r border-white/5 p-5 flex flex-col gap-6 hidden md:flex">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-md">
              <Icon name="bolt" size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight">CartaVerso</span>
          </div>
          <NotificationsBell />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-pill flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
              }
            >
              <span className="flex items-center gap-3">
                <Icon name={item.icon} size={18} />
                {item.label}
              </span>
              {item.to === "/mensajes" && unreadMessages > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </NavLink>
          ))}
          <a
            href={`${API_URL}/manual`}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70"
          >
            <Icon name="shield" size={18} />
            Manual
          </a>
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-300"
            >
              <Icon name="crown" size={18} />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          {user && (
            <NavLink
              to={`/perfil/${user.username}`}
              className={({ isActive }) =>
                `nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
              }
            >
              <div className="w-5 h-5 rounded-full bg-arcane-800 overflow-hidden flex items-center justify-center text-[10px]">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : (user.displayName ?? user.username)[0].toUpperCase()}
              </div>
              {user.displayName ?? user.username}
            </NavLink>
          )}
          <button
            onClick={() => {
              logout();
              navigate("/auth");
            }}
            className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/50 text-left"
          >
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[var(--bg-elevated)] z-30">
        <button onClick={() => setMenuOpen(true)} className="p-1 -ml-1 text-white/80" aria-label="Abrir menú">
          <Icon name="menu" size={22} />
        </button>
        <span className="text-base font-bold font-display">CartaVerso</span>
        <NotificationsBell />
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-[var(--bg-elevated)] border-r border-white/5 z-50 p-5 flex flex-col gap-6 overflow-y-auto"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-md">
                  <Icon name="bolt" size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold font-display tracking-tight">CartaVerso</span>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `nav-pill flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </span>
                    {item.to === "/mensajes" && unreadMessages > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </NavLink>
                ))}
                <a
                  href={`${API_URL}/manual`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70"
                >
                  <Icon name="shield" size={18} />
                  Manual
                </a>
                {user?.role === "ADMIN" && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-300"
                  >
                    <Icon name="crown" size={18} />
                    Admin
                  </NavLink>
                )}
              </nav>

              <div className="mt-auto flex flex-col gap-1">
                {user && (
                  <NavLink
                    to={`/perfil/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
                    }
                  >
                    <div className="w-5 h-5 rounded-full bg-arcane-800 overflow-hidden flex items-center justify-center text-[10px]">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : (user.displayName ?? user.username)[0].toUpperCase()}
                    </div>
                    {user.displayName ?? user.username}
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate("/auth");
                  }}
                  className="nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/50 text-left"
                >
                  <Icon name="logout" size={18} />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-white/10 bg-[var(--bg-elevated)] flex justify-around py-2 z-20">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `relative p-2 rounded-lg ${isActive ? "text-arcane-400" : "text-white/50"}`}
          >
            <Icon name={item.icon} size={22} />
            {item.to === "/mensajes" && unreadMessages > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-rose-500" />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
