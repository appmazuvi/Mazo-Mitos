import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Icon } from "./Icon";

const navItems = [
  { to: "/", label: "Inicio", icon: "home" as const, end: true },
  { to: "/explorar", label: "Explorar", icon: "search" as const },
  { to: "/cartas", label: "Cartas", icon: "layers" as const },
  { to: "/mazos", label: "Mazos", icon: "deck" as const },
  { to: "/batalla", label: "Batalla", icon: "swords" as const },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside className="w-64 shrink-0 border-r border-white/5 p-5 flex flex-col gap-6 hidden md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="w-9 h-9 rounded-lg bg-arcane-500 flex items-center justify-center shadow-md">
            <Icon name="bolt" size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">CartaVerso</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          {user && (
            <NavLink
              to={`/perfil/${user.username}`}
              className={({ isActive }) =>
                `nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? "active" : "text-white/70"}`
              }
            >
              <Icon name="user" size={18} />
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

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-white/10 bg-[var(--bg-elevated)] flex justify-around py-2 z-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `p-2 rounded-lg ${isActive ? "text-arcane-400" : "text-white/50"}`}
          >
            <Icon name={item.icon} size={22} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
