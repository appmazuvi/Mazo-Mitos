import { NavLink, Outlet, Link } from "react-router-dom";
import { Icon } from "../components/Icon";

const items = [
  { to: "/admin", label: "Dashboard", icon: "gauge" as const, end: true },
  { to: "/admin/cartas", label: "Cartas", icon: "layers" as const },
  { to: "/admin/usuarios", label: "Usuarios", icon: "users" as const },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--bg)" }}>
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/5 p-5 flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-md">
            <Icon name="crown" size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold font-display leading-none">CartaVerso</p>
            <p className="text-[10px] text-arcane-300/80 uppercase tracking-wider mt-0.5">Admin</p>
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

      <header className="md:hidden sticky top-0 z-20 bg-[var(--bg-elevated)] border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-md shrink-0">
              <Icon name="crown" size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold font-display">Admin</p>
          </div>
          <Link to="/" className="text-xs text-white/50 flex items-center gap-1.5">
            <Icon name="home" size={16} />
            Sitio
          </Link>
        </div>
        <nav className="flex px-2 pb-2 gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-pill flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium ${isActive ? "active" : "text-white/70"}`
              }
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
