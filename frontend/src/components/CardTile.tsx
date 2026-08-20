import { motion } from "framer-motion";
import type { Card } from "../types";
import { Icon } from "./Icon";

type IconName = "shield" | "bolt" | "heartFilled" | "layers" | "swords" | "skull" | "flame" | "circle" | "gem" | "spark" | "crown";

const rarityStyles: Record<Card["rarity"], { text: string; label: string; icon: IconName }> = {
  COMUN: { text: "text-white/55", label: "Común", icon: "circle" },
  RARA: { text: "text-sky-400", label: "Rara", icon: "gem" },
  EPICA: { text: "text-arcane-300", label: "Épica", icon: "spark" },
  LEGENDARIA: { text: "text-amber-300", label: "Legendaria", icon: "crown" },
};

const KEYWORD_INFO: Record<string, { label: string; icon: IconName }> = {
  TAUNT: { label: "Provocar", icon: "shield" },
  CHARGE: { label: "Carga", icon: "bolt" },
  LIFESTEAL: { label: "Vida robada", icon: "heartFilled" },
};

function spellEffectInfo(effectKey: string | null): { label: string; icon: IconName } | null {
  if (!effectKey) return null;
  if (effectKey.startsWith("DAMAGE") || effectKey.startsWith("AOE_DAMAGE")) return { label: "Daño", icon: "flame" };
  if (effectKey.startsWith("HEAL")) return { label: "Curación", icon: "heartFilled" };
  if (effectKey.startsWith("DRAW")) return { label: "Roba cartas", icon: "layers" };
  if (effectKey.startsWith("BUFF")) return { label: "Potencia", icon: "swords" };
  if (effectKey === "DESTROY_TARGET") return { label: "Destruye", icon: "skull" };
  return null;
}

interface CardTileProps {
  card: Card;
  quantity?: number;
  onClick?: () => void;
  actionLabel?: string;
  index?: number;
}

export function CardTile({ card, quantity, onClick, actionLabel, index = 0 }: CardTileProps) {
  const style = rarityStyles[card.rarity];
  const keyword = card.type === "CREATURE" ? KEYWORD_INFO[card.effectKey ?? ""] : spellEffectInfo(card.effectKey);
  const isFoil = card.rarity === "EPICA" || card.rarity === "LEGENDARIA";

  return (
    <motion.button
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.4), ease: "easeOut" }}
      onClick={onClick}
      disabled={!onClick}
      className={`card-frame rarity-${card.rarity} relative flex flex-col text-left transition hover:-translate-y-1 overflow-hidden ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {card.imageUrl && (
        <div className="relative h-24 shrink-0 overflow-hidden">
          <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#170c04] to-transparent" />
          {isFoil && <div className="card-foil-sweep" />}
        </div>
      )}
      <div className="relative flex flex-col justify-between p-3 pt-2 flex-1">
        <div className="cost-gem absolute -top-6 right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center font-thematic stat-chip border-2 border-[#170c04] z-10">
          {card.cost}
        </div>
        {quantity !== undefined && quantity > 0 && (
          <div className="absolute -top-6 left-2 w-6 h-6 rounded-full bg-black/60 border-2 border-[#170c04] text-white text-xs font-bold flex items-center justify-center z-10">
            {quantity}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold leading-tight pr-1 font-thematic">{card.name}</p>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] uppercase tracking-wide">
            <Icon name={style.icon} size={10} className={style.text} filled />
            <span className={style.text}>{style.label}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/45">{card.type === "CREATURE" ? "Criatura" : "Hechizo"}</span>
          </div>
        </div>

        {keyword && (
          <div className="mt-1.5">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)" }}
            >
              <Icon name={keyword.icon} size={10} /> {keyword.label}
            </span>
          </div>
        )}

        <p className="text-[11px] text-white/55 mt-1.5 leading-snug">{card.description}</p>

        {card.type === "CREATURE" && (
          <div className="flex items-center justify-between mt-2">
            <span
              className="stat-badge flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white stat-chip"
              style={{ ["--badge-color" as string]: "#f97316" }}
              title="Ataque"
            >
              <Icon name="swords" size={12} filled />
              {card.attack}
            </span>
            <span
              className="stat-badge flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white stat-chip"
              style={{ ["--badge-color" as string]: "#10b981" }}
              title="Vida"
            >
              <Icon name="heartFilled" size={12} filled />
              {card.health}
            </span>
          </div>
        )}
      </div>
      {actionLabel && (
        <div className="absolute inset-0 rounded-[inherit] bg-black/65 opacity-0 hover:opacity-100 flex items-center justify-center text-xs font-semibold font-thematic tracking-wide transition z-20">
          {actionLabel}
        </div>
      )}
    </motion.button>
  );
}
