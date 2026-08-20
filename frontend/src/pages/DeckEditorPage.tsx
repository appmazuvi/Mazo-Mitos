import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { CardTile } from "../components/CardTile";
import { Icon } from "../components/Icon";
import type { Card, Deck } from "../types";

const DECK_SIZE = 30;
const MAX_COPIES: Record<Card["rarity"], number> = { COMUN: 3, RARA: 3, EPICA: 2, LEGENDARIA: 1 };

export function DeckEditorPage() {
  const { id } = useParams();
  const isNew = id === "nuevo";
  const navigate = useNavigate();

  const [allCards, setAllCards] = useState<Card[]>([]);
  const [name, setName] = useState("Mazo sin nombre");
  const [isPublic, setIsPublic] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Card[]>("/api/cards").then(setAllCards);
    if (!isNew && id) {
      api.get<Deck>(`/api/decks/${id}`).then((deck) => {
        setName(deck.name);
        setIsPublic(deck.isPublic);
        setFeatured(deck.featured ?? false);
        const sel: Record<string, number> = {};
        for (const dc of deck.cards) sel[dc.cardId] = dc.quantity;
        setSelection(sel);
      });
    }
  }, [id, isNew]);

  const total = useMemo(() => Object.values(selection).reduce((s, q) => s + q, 0), [selection]);

  function addCard(card: Card) {
    setSelection((s) => {
      const current = s[card.id] ?? 0;
      const currentTotal = Object.values(s).reduce((sum, q) => sum + q, 0);
      if (current >= MAX_COPIES[card.rarity]) return s;
      if (currentTotal >= DECK_SIZE) return s;
      return { ...s, [card.id]: current + 1 };
    });
  }

  function removeCard(cardId: string) {
    setSelection((s) => {
      const next = { ...s };
      if (!next[cardId]) return s;
      next[cardId] -= 1;
      if (next[cardId] <= 0) delete next[cardId];
      return next;
    });
  }

  async function save() {
    setError(null);
    if (total !== DECK_SIZE) {
      setError(`El mazo debe tener exactamente ${DECK_SIZE} cartas (tenés ${total})`);
      return;
    }
    setSaving(true);
    const payload = {
      name,
      isPublic,
      featured,
      cards: Object.entries(selection).map(([cardId, quantity]) => ({ cardId, quantity })),
    };
    try {
      if (isNew) {
        const deck = await api.post<Deck>("/api/decks", payload);
        navigate(`/mazos/${deck.id}`);
      } else {
        await api.put(`/api/decks/${id}`, payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || isNew) return;
    if (!confirm("¿Eliminar este mazo?")) return;
    await api.delete(`/api/decks/${id}`);
    navigate("/mazos");
  }

  const deckList = Object.entries(selection)
    .map(([cardId, quantity]) => ({ card: allCards.find((c) => c.id === cardId)!, quantity }))
    .filter((e) => e.card)
    .sort((a, b) => a.card.cost - b.card.cost);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 pb-24 md:pb-8 flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="order-2 lg:order-1">
        <div className="flex items-center gap-3 mb-6">
          <input
            className="input-field text-lg font-bold bg-transparent border-none px-0 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {allCards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              quantity={selection[card.id]}
              actionLabel="Agregar"
              onClick={() => addCard(card)}
            />
          ))}
        </div>
      </div>

      <div className="order-1 lg:order-2 card-surface p-5 h-fit lg:sticky lg:top-8">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold">Tu mazo</p>
          <span className={`text-sm font-semibold ${total === DECK_SIZE ? "text-emerald-400" : "text-white/50"}`}>
            {total}/{DECK_SIZE}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2 mb-4">
          <label className="flex items-center gap-2 text-xs text-white/50">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Hacer público este mazo
          </label>
          <label className="flex items-center gap-2 text-xs text-white/50">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} disabled={!isPublic} />
            Destacar en mi perfil {!isPublic && "(requiere que sea público)"}
          </label>
        </div>

        <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
          {deckList.length === 0 && <p className="text-xs text-white/40">Agregá cartas desde la colección.</p>}
          {deckList.map(({ card, quantity }) => (
            <div key={card.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-white/5">
              <span className="flex items-center gap-2 truncate">
                <span className="w-5 h-5 rounded-full bg-arcane-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {card.cost}
                </span>
                <span className="truncate">{card.name}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-white/50">x{quantity}</span>
                <button onClick={() => removeCard(card.id)} className="text-white/30 hover:text-white/70">
                  <Icon name="x" size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <div className="flex flex-col gap-2 mt-5">
          <button onClick={save} disabled={saving} className="btn-primary py-2.5 text-sm">
            {saving ? "Guardando..." : "Guardar mazo"}
          </button>
          {!isNew && (
            <button onClick={remove} className="btn-ghost py-2.5 text-sm text-red-400 border-red-400/20">
              Eliminar mazo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
