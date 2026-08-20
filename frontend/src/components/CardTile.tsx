import type { Card } from "../types";

const rarityStyles: Record<Card["rarity"], { border: string; text: string; label: string }> = {
  COMUN: { border: "border-white/15", text: "text-white/60", label: "Común" },
  RARA: { border: "border-sky-500/40", text: "text-sky-400", label: "Rara" },
  EPICA: { border: "border-arcane-500/50", text: "text-arcane-300", label: "Épica" },
  LEGENDARIA: { border: "border-amber-400/50", text: "text-amber-300", label: "Legendaria" },
};

interface CardTileProps {
  card: Card;
  quantity?: number;
  onClick?: () => void;
  actionLabel?: string;
}

export function CardTile({ card, quantity, onClick, actionLabel }: CardTileProps) {
  const style = rarityStyles[card.rarity];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative flex flex-col justify-between p-3 h-40 rounded-lg border ${style.border} bg-[var(--bg-elevated)] text-left transition hover:-translate-y-0.5 hover:shadow-md ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-arcane-500 text-white text-xs font-bold flex items-center justify-center">
        {card.cost}
      </div>
      {quantity !== undefined && quantity > 0 && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold flex items-center justify-center">
          {quantity}
        </div>
      )}
      <div className="mt-6">
        <p className="text-sm font-semibold leading-tight pr-6">{card.name}</p>
        <p className={`text-[11px] mt-1 ${style.text}`}>{style.label}</p>
      </div>
      <p className="text-[11px] text-white/50 line-clamp-2">{card.description}</p>
      <div className="flex items-center justify-between text-xs font-semibold">
        {card.type === "CREATURE" ? (
          <>
            <span className="text-orange-300">{card.attack} ATK</span>
            <span className="text-emerald-300">{card.health} VID</span>
          </>
        ) : (
          <span className="text-white/40 uppercase tracking-wide text-[10px]">Hechizo</span>
        )}
      </div>
      {actionLabel && (
        <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-xs font-semibold transition">
          {actionLabel}
        </div>
      )}
    </button>
  );
}
