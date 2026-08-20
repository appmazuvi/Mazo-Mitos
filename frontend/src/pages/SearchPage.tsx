import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "../components/Icon";
import { CardTile } from "../components/CardTile";
import type { Deck } from "../types";

interface UserResult {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

interface RankedUser extends UserResult {
  wins: number;
}

type Tab = "jugadores" | "mazos" | "ranking";

export function SearchPage() {
  const [tab, setTab] = useState<Tab>("jugadores");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [ranking, setRanking] = useState<RankedUser[]>([]);

  useEffect(() => {
    if (tab === "ranking") api.get<RankedUser[]>("/api/search/leaderboard").then(setRanking);
  }, [tab]);

  useEffect(() => {
    if (tab === "jugadores") {
      const t = setTimeout(() => {
        if (query.trim()) api.get<UserResult[]>(`/api/search/users?q=${encodeURIComponent(query)}`).then(setUsers);
        else setUsers([]);
      }, 250);
      return () => clearTimeout(t);
    }
    if (tab === "mazos") {
      api.get<Deck[]>(`/api/search/decks${query.trim() ? `?q=${encodeURIComponent(query)}` : ""}`).then(setDecks);
    }
  }, [tab, query]);

  const tabs: { key: Tab; label: string; icon: "search" | "deck" | "trophy" }[] = [
    { key: "jugadores", label: "Jugadores", icon: "search" },
    { key: "mazos", label: "Mazos públicos", icon: "deck" },
    { key: "ranking", label: "Ranking", icon: "trophy" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <h1 className="text-xl font-bold font-display mb-6">Explorar</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`nav-pill flex items-center gap-2 px-3 py-2 text-sm font-medium ${tab === t.key ? "active" : "text-white/60 border border-white/10"}`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "jugadores" || tab === "mazos") && (
        <input
          className="input-field w-full mb-6 text-sm"
          placeholder={tab === "jugadores" ? "Buscar por usuario..." : "Buscar mazo por nombre..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {tab === "jugadores" && (
        <div className="flex flex-col gap-2">
          {users.length === 0 && query.trim() && <p className="text-sm text-white/40">Sin resultados.</p>}
          {users.map((u) => (
            <Link key={u.id} to={`/perfil/${u.username}`} className="card-surface p-4 flex items-center gap-3 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-full bg-arcane-800 flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : (u.displayName ?? u.username)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.displayName ?? u.username}</p>
                <p className="text-xs text-white/40 truncate">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "mazos" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-display font-semibold">{deck.name}</p>
                <span className="text-xs text-white/40">por {deck.owner?.displayName ?? deck.owner?.username}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {deck.cards.slice(0, 8).map((dc) => (
                  <CardTile key={dc.id} card={dc.card} quantity={dc.quantity} />
                ))}
              </div>
            </div>
          ))}
          {decks.length === 0 && <p className="text-sm text-white/40">No hay mazos públicos todavía.</p>}
        </div>
      )}

      {tab === "ranking" && (
        <div className="card-surface divide-y divide-white/5">
          {ranking.length === 0 && <p className="text-sm text-white/40 p-6 text-center">Todavía nadie ganó una partida.</p>}
          {ranking.map((u, i) => (
            <Link key={u.id} to={`/perfil/${u.username}`} className="flex items-center gap-3 p-3.5 hover:bg-white/5 transition">
              <span className={`font-display font-bold w-6 text-center ${i === 0 ? "text-amber-300" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-white/40"}`}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-arcane-800 flex items-center justify-center text-xs font-semibold shrink-0">
                {(u.displayName ?? u.username)[0].toUpperCase()}
              </div>
              <p className="text-sm font-medium flex-1 truncate">{u.displayName ?? u.username}</p>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                <Icon name="trophy" size={14} />
                {u.wins}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
