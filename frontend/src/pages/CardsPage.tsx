import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { CardTile } from "../components/CardTile";
import { CardDetailModal } from "../components/CardDetailModal";
import type { Card } from "../types";

export function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    api.get<Card[]>("/api/cards").then(setCards);
  }, []);

  const filtered = useMemo(
    () => cards.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [cards, query]
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display">Colección</h1>
        <input
          className="input-field text-sm w-48"
          placeholder="Buscar carta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtered.map((card, i) => (
          <CardTile key={card.id} card={card} index={i} onClick={() => setOpenIndex(i)} />
        ))}
      </div>

      {openIndex !== null && (
        <CardDetailModal cards={filtered} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </div>
  );
}
