import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../components/Icon";
import type { AdminMetrics } from "../../types";

const stats: { key: keyof AdminMetrics; label: string; icon: "users" | "swords" | "message" | "layers" | "deck" }[] = [
  { key: "userCount", label: "Usuarios", icon: "users" },
  { key: "matchCount", label: "Partidas jugadas", icon: "swords" },
  { key: "postCount", label: "Publicaciones", icon: "message" },
  { key: "cardCount", label: "Cartas", icon: "layers" },
  { key: "deckCount", label: "Mazos creados", icon: "deck" },
  { key: "matchesToday", label: "Partidas hoy", icon: "swords" },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    api.get<AdminMetrics>("/api/admin/metrics").then(setMetrics);
  }, []);

  if (!metrics) return <div className="p-8 text-white/40 text-sm">Cargando...</div>;

  const maxUsers = Math.max(1, ...metrics.usersLast7Days.map((d) => d.count));

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <h1 className="text-xl font-bold font-display mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.key} className="card-surface p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-arcane-500/15 text-arcane-300 flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{metrics[s.key] as number}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-surface p-5">
          <p className="font-display font-semibold mb-4">Nuevos usuarios (7 días)</p>
          <div className="flex items-end gap-2 h-32">
            {metrics.usersLast7Days.length === 0 && <p className="text-xs text-white/40">Sin datos todavía.</p>}
            {metrics.usersLast7Days.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-arcane-600 to-arcane-400"
                  style={{ height: `${Math.max(6, (d.count / maxUsers) * 100)}%` }}
                />
                <span className="text-[9px] text-white/40">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="font-display font-semibold mb-4">Cartas más usadas en mazos</p>
          <div className="flex flex-col gap-2">
            {metrics.topCards.map((tc, i) =>
              tc.card ? (
                <div key={tc.card.id} className="flex items-center gap-3 text-sm">
                  <span className="text-white/30 w-4 font-display">{i + 1}</span>
                  <span className="flex-1 truncate">{tc.card.name}</span>
                  <span className="text-amber-300 font-semibold">{tc.count}</span>
                </div>
              ) : null
            )}
            {metrics.topCards.length === 0 && <p className="text-xs text-white/40">Sin datos todavía.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
