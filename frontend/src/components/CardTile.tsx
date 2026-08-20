import type { Card } from "../types";
import { Icon } from "./Icon";

const rarityStyles: Record<Card["rarity"], { text: string; label: string }> = {
  COMUN: { text: "text-white/55", label: "Común" },
  RARA: { text: "text-sky-400", label: "Rara" },
  EPICA: { text: "text-arcane-300", label: "Épica" },
  LEGENDARIA: { text: "text-amber-300", label: "Legendaria" },
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
      className={`card-frame rarity-${card.rarity} relative flex flex-col text-left transition hover:-translate-y-1 overflow-hidden ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {card.imageUrl && (
        <div className="relative h-20 shrink-0 overflow-hidden">
          <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#171225] to-transparent" />
        </div>
      )}
      <div className="relative flex flex-col justify-between p-3 pt-2 flex-1">
        <div className="cost-gem absolute -top-6 right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center font-thematic stat-chip border-2 border-[#171225]">
          {card.cost}
        </div>
        {quantity !== undefined && quantity > 0 && (
          <div className="absolute -top-6 left-2 w-6 h-6 rounded-full bg-black/60 border-2 border-[#171225] text-white text-xs font-bold flex items-center justify-center">
            {quantity}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold leading-tight pr-1 font-thematic">{card.name}</p>
          <p className={`text-[11px] mt-0.5 uppercase tracking-wide ${style.text}`}>{style.label}</p>
        </div>
        <p className="text-[11px] text-white/50 line-clamp-2 mt-1">{card.description}</p>
        <div className="flex items-center justify-between text-xs font-bold mt-1.5">
          {card.type === "CREATURE" ? (
            <>
              <span className="flex items-center gap-1 text-orange-300 stat-chip">
                <Icon name="swords" size={12} /> {card.attack}
              </span>
              <span className="flex items-center gap-1 text-emerald-300 stat-chip">
                <Icon name="heartFilled" size={12} filled /> {card.health}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-arcane-300 uppercase tracking-wide text-[10px]">
              <Icon name="bolt" size={12} /> Hechizo
            </span>
          )}
        </div>
      </div>
      {actionLabel && (
        <div className="absolute inset-0 rounded-[inherit] bg-black/65 opacity-0 hover:opacity-100 flex items-center justify-center text-xs font-semibold font-thematic tracking-wide transition">
          {actionLabel}
        </div>
      )}
    </button>
  );
}
