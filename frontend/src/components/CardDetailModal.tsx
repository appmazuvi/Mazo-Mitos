import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icon";
import type { Card } from "../types";

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

const MAX_TILT = 12;

function TiltCard({ card }: { card: Card }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });
  const style = rarityStyles[card.rarity];
  const keyword = card.type === "CREATURE" ? KEYWORD_INFO[card.effectKey ?? ""] : spellEffectInfo(card.effectKey);
  const isFoil = card.rarity === "EPICA" || card.rarity === "LEGENDARIA";

  function updateFromPoint(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * MAX_TILT * 2,
      ry: (px - 0.5) * MAX_TILT * 2,
      px: px * 100,
      py: py * 100,
    });
  }

  function reset() {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50 });
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={(e) => updateFromPoint(e.clientX, e.clientY)}
        onMouseLeave={reset}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) updateFromPoint(t.clientX, t.clientY);
        }}
        onTouchEnd={reset}
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry, scale: tilt.rx || tilt.ry ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="card-frame relative w-full max-w-[320px] mx-auto select-none"
        style={{ ["--frame-color" as string]: `var(--rarity-${card.rarity.toLowerCase()})`, transformStyle: "preserve-3d" }}
      >
        {card.imageUrl && (
          <div className="relative h-56 shrink-0 overflow-hidden rounded-t-[inherit]">
            <img src={card.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#170c04] to-transparent" />
            {isFoil && <div className="card-foil-sweep" style={{ opacity: 0.5 }} />}
          </div>
        )}
        {/* Brillo que sigue el mouse, para que se sienta como una carta física en la mano */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.16), transparent 55%)`,
          }}
        />

        <div className="relative flex flex-col justify-between p-4 pt-3 flex-1">
          <div className="cost-gem absolute -top-7 right-3 w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center font-thematic stat-chip border-2 border-[#170c04] z-10">
            {card.cost}
          </div>

          <div>
            <p className="text-lg font-semibold leading-tight pr-6 font-thematic">{card.name}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs uppercase tracking-wide">
              <Icon name={style.icon} size={12} className={style.text} filled />
              <span className={style.text}>{style.label}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/45">{card.type === "CREATURE" ? "Criatura" : "Hechizo"}</span>
              {card.set && (
                <>
                  <span className="text-white/25">·</span>
                  <span className="text-white/35">{card.set}</span>
                </>
              )}
            </div>
          </div>

          {keyword && (
            <div className="mt-2">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)" }}
              >
                <Icon name={keyword.icon} size={11} /> {keyword.label}
              </span>
            </div>
          )}

          <p className="text-[13px] text-white/60 mt-3 leading-snug">{card.description}</p>

          {card.type === "CREATURE" && (
            <div className="flex items-center justify-between mt-4">
              <span
                className="stat-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white stat-chip"
                style={{ ["--badge-color" as string]: "#f97316" }}
                title="Ataque"
              >
                <Icon name="swords" size={14} filled />
                {card.attack}
              </span>
              <span
                className="stat-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white stat-chip"
                style={{ ["--badge-color" as string]: "#10b981" }}
                title="Vida"
              >
                <Icon name="heartFilled" size={14} filled />
                {card.health}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function CardDetailModal({
  cards,
  index,
  onClose,
  onNavigate,
}: {
  cards: Card[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const card = cards[index];
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % cards.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + cards.length) % cards.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, cards.length, onClose, onNavigate]);

  if (!card) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white/60 hover:text-white p-2" aria-label="Cerrar">
          <Icon name="x" size={26} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + cards.length) % cards.length);
          }}
          className="hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10"
          aria-label="Carta anterior"
        >
          <Icon name="chevronLeft" size={30} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % cards.length);
          }}
          className="hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10"
          aria-label="Carta siguiente"
        >
          <Icon name="chevronRight" size={30} />
        </button>

        <div
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            if (dx > 60) onNavigate((index - 1 + cards.length) % cards.length);
            else if (dx < -60) onNavigate((index + 1) % cards.length);
            touchStartX.current = null;
          }}
          className="w-full max-w-sm"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 30, rotate: 3 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -30, rotate: -3 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <TiltCard card={card} />
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-white/35 mt-4">
            {index + 1} / {cards.length} · usá las flechas o deslizá para ver otra carta
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
