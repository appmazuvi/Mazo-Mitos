import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance } from "../types";

export interface CardPulse {
  key: number;
  type: "damage" | "heal" | "buff";
  value: number;
}

interface GameCardProps {
  card: CardInstance;
  size?: "sm" | "md";
  disabled?: boolean;
  selected?: boolean;
  targetable?: boolean;
  attacking?: boolean;
  pulse?: CardPulse | null;
  onClick?: () => void;
}

export function GameCard({ card, size = "md", disabled, selected, targetable, attacking, pulse, onClick }: GameCardProps) {
  const w = size === "sm" ? "w-16 h-24" : "w-20 h-28";
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -24, scale: 0.7, rotate: -6 }}
      animate={
        attacking
          ? { opacity: 1, y: [0, -14, 0], scale: [1, 1.08, 1], rotate: 0, transition: { duration: 0.38 } }
          : { opacity: 1, y: 0, scale: 1, rotate: 0 }
      }
      exit={{ opacity: 0, scale: 0.4, rotate: 12, filter: "brightness(2) blur(2px)", transition: { duration: 0.35 } }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      onClick={onClick}
      disabled={!onClick}
      className={`card-frame relative ${w} shrink-0 text-left overflow-hidden
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
            <motion.span key={`atk-${card.attack}`} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="text-orange-300">
              {card.attack}
            </motion.span>
            <motion.span
              key={`hp-${card.currentHealth}`}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              className={pulse?.type === "damage" ? "text-red-400" : "text-emerald-300"}
            >
              {card.currentHealth}
            </motion.span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pulse && (
          <motion.div
            key={pulse.key}
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: 1, y: -22, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 font-display font-bold text-base pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] ${
              pulse.type === "damage" ? "text-red-400" : "text-emerald-300"
            }`}
          >
            {pulse.type === "damage" ? `-${pulse.value}` : `+${pulse.value}`}
          </motion.div>
        )}
      </AnimatePresence>

      {pulse?.type === "damage" && (
        <motion.div
          key={`flash-${pulse.key}`}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-red-500 pointer-events-none mix-blend-overlay"
        />
      )}
    </motion.button>
  );
}
