import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../components/Icon";
import type { AdminUser } from "../../types";

export function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  function load(q?: string) {
    api.get<AdminUser[]>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setUsers);
  }
  useEffect(() => load(), []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  async function toggleBan(u: AdminUser) {
    if (u.banned) {
      await api.post(`/api/admin/users/${u.id}/unban`);
    } else {
      const reason = prompt("Motivo de la suspensión (opcional):") ?? undefined;
      await api.post(`/api/admin/users/${u.id}/ban`, { reason });
    }
    load(query);
  }

  async function toggleRole(u: AdminUser) {
    const newRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`¿Cambiar el rol de ${u.username} a ${newRole}?`)) return;
    await api.post(`/api/admin/users/${u.id}/role`, { role: newRole });
    load(query);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display">Usuarios</h1>
        <input className="input-field text-sm w-56" placeholder="Buscar usuario o email..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-white/40 border-b border-white/5">
              <th className="p-3">Usuario</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Posts</th>
              <th className="p-3">Mazos</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 font-medium">{u.displayName ?? u.username}</td>
                <td className="p-3 text-white/50">{u.email}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleRole(u)}
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${u.role === "ADMIN" ? "bg-amber-400/15 text-amber-300" : "bg-white/5 text-white/50"}`}
                  >
                    {u.role}
                  </button>
                </td>
                <td className="p-3 text-white/60">{u._count.posts}</td>
                <td className="p-3 text-white/60">{u._count.decks}</td>
                <td className="p-3">
                  {u.banned ? <span className="text-xs text-red-400 font-semibold">Suspendido</span> : <span className="text-xs text-emerald-400 font-semibold">Activo</span>}
                </td>
                <td className="p-3">
                  <button onClick={() => toggleBan(u)} className={`text-white/40 hover:text-white/80 ${u.banned ? "" : "hover:text-red-400"}`} title={u.banned ? "Reactivar" : "Suspender"}>
                    <Icon name={u.banned ? "check" : "ban"} size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
