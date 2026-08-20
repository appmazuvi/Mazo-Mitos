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
      className={`relative ${w} shrink-0 rounded-md border bg-[var(--bg-elevated)] text-left p-1.5 transition
        ${selected ? "border-arcane-400 ring-2 ring-arcane-400 -translate-y-2" : "border-white/15"}
        ${targetable ? "ring-2 ring-rose-400 animate-pulse" : ""}
        ${disabled ? "opacity-40" : onClick ? "hover:-translate-y-1 cursor-pointer" : "cursor-default"}`}
    >
      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-arcane-500 text-white text-[10px] font-bold flex items-center justify-center">
        {card.cost}
      </div>
      <p className="text-[10px] font-semibold leading-tight mt-2 line-clamp-3">{card.name}</p>
      {card.type === "CREATURE" && (
        <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[10px] font-bold">
          <span className="text-orange-300">{card.attack}</span>
          <span className="text-emerald-300">{card.currentHealth}</span>
        </div>
      )}
    </button>
  );
}
