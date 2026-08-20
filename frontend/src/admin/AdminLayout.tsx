import { NavLink, Outlet, Link } from "react-router-dom";
import { Icon } from "../components/Icon";

const items = [
  { to: "/admin", label: "Dashboard", icon: "gauge" as const, end: true },
  { to: "/admin/cartas", label: "Cartas", icon: "layers" as const },
  { to: "/admin/usuarios", label: "Usuarios", icon: "users" as const },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <aside className="w-64 shrink-0 border-r border-white/5 p-5 flex flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-md">
            <Icon name="crown" size={18} className="text-black/70" />
          </div>
          <div>
            <p className="text-sm font-bold font-display leading-none">CartaVerso</p>
            <p className="text-[10px] text-amber-300/80 uppercase tracking-wider mt-0.5">Admin</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map((item) => (
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

        <Link to="/" className="mt-auto nav-pill flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/50">
          <Icon name="home" size={18} />
          Volver al sitio
        </Link>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
