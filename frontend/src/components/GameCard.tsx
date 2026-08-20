import type { CardInstance } from "../types";

interface GameCardProps {
  card: CardInstance;
  size?: "sm" | "md";
  disabled?: boolean;
  selected?: boolean;
  targetable?: boolean;
  onClick?: () => void;
}

export function GameCard({ card, size = "md", disabled, selected, targetable, onClick }: GameCardProps) {
  const w = size === "sm" ? "w-16 h-24" : "w-20 h-28";
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`card-frame relative ${w} shrink-0 text-left overflow-hidden transition
        ${selected ? "ring-2 ring-arcane-400 -translate-y-2" : ""}
        ${targetable ? "ring-2 ring-rose-400 animate-pulse" : ""}
        ${disabled ? "opacity-40 grayscale" : onClick ? "hover:-translate-y-1 cursor-pointer" : "cursor-default"}`}
      style={{ ["--frame-color" as string]: card.effectKey === "TAUNT" ? "#e8b64c" : "#6a5a8a" }}
    >
      {card.imageUrl && (
        <div className="absolute inset-0">
          <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
        </div>
      )}
      <div className="relative p-1.5 h-full flex flex-col">
        <div className="cost-gem absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center font-display">
          {card.cost}
        </div>
        <p className="text-[10px] font-semibold leading-tight mt-2 line-clamp-3 font-display stat-chip">{card.name}</p>
        {card.type === "CREATURE" && (
          <div className="mt-auto flex justify-between text-[10px] font-bold stat-chip">
            <span className="text-orange-300">{card.attack}</span>
            <span className="text-emerald-300">{card.currentHealth}</span>
          </div>
        )}
      </div>
    </button>
  );
}
