import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "../components/Icon";
import type { Deck } from "../types";

export function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function load() {
    api.get<Deck[]>("/api/decks").then((d) => {
      setDecks(d);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function generateAuto() {
    setGenerating(true);
    try {
      const deck = await api.post<Deck>("/api/decks/auto");
      setDecks((d) => [deck, ...d]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display">Tus mazos</h1>
        <div className="flex gap-2">
          <button onClick={generateAuto} disabled={generating} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
            <Icon name={generating ? "loader" : "bolt"} size={16} className={generating ? "animate-spin" : ""} />
            Generar automático
          </button>
          <Link to="/mazos/nuevo" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Icon name="plus" size={16} />
            Nuevo mazo
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Cargando...</p>
      ) : decks.length === 0 ? (
        <div className="card-surface p-8 text-center text-white/50 text-sm">Todavía no armaste ningún mazo.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {decks.map((deck) => {
            const total = deck.cards.reduce((s, c) => s + c.quantity, 0);
            return (
              <Link key={deck.id} to={`/mazos/${deck.id}`} className="card-surface p-5 hover:-translate-y-0.5 transition">
                <div className="flex items-center justify-between">
                  <p className="font-semibold flex items-center gap-1.5">
                    {deck.name}
                    {deck.featured && <Icon name="star" size={13} className="text-amber-300" />}
                  </p>
                  <span className="text-xs text-white/40">{total}/30</span>
                </div>
                <p className="text-xs text-white/40 mt-1">{deck.isPublic ? "Público" : "Privado"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
