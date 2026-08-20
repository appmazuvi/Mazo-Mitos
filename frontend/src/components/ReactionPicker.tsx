import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { ReactionType } from "../types";

const REACTIONS: { type: ReactionType; icon: "heartFilled" | "gem" | "flame" | "impact" | "spark"; label: string; color: string; hex: string }[] = [
  { type: "LIKE", icon: "heartFilled", label: "Me gusta", color: "text-rose-400", hex: "#fb7185" },
  { type: "LOVE", icon: "gem", label: "Me encanta", color: "text-pink-400", hex: "#f472b6" },
  { type: "FIRE", icon: "flame", label: "Está en llamas", color: "text-orange-400", hex: "#fb923c" },
  { type: "LAUGH", icon: "impact", label: "Me hace reír", color: "text-amber-300", hex: "#fcd34d" },
  { type: "WOW", icon: "spark", label: "Impresionante", color: "text-arcane-300", hex: "#a68efb" },
];

const LONG_PRESS_MS = 350;
const CLOSE_DELAY_MS = 150;

export function ReactionPicker({
  current,
  total,
  onReact,
}: {
  current: ReactionType | null;
  total: number;
  onReact: (type: ReactionType | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<ReactionType | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);
  const active = REACTIONS.find((r) => r.type === current);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const cancelClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const startPress = () => {
    longPressedRef.current = false;
    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      setOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    clearPressTimer();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (open) {
      setOpen(false);
      return;
    }
    onReact(current ? null : "LIKE");
  };

  return (
    <div
      className="relative"
      ref={rootRef}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex items-center gap-1.5 text-sm ${active ? active.color : "text-white/50"}`}
      >
        <Icon name={active ? active.icon : "heart"} size={17} filled={!!active} />
        {total}
      </button>

      {open && (
        // Wrapper adds invisible bottom padding (not margin) so the gap between the
        // trigger button and the pill is still part of this hoverable subtree — a
        // margin gap here would be un-painted space where mouseleave fires early.
        <div className="absolute bottom-full left-0 pb-2 z-20">
          <div
            className="flex gap-1 rounded-full px-2 py-1.5"
            style={{
              background: "linear-gradient(180deg, rgba(22,22,28,0.97), rgba(10,10,13,0.99))",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px)",
            }}
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => {
                  onReact(current === r.type ? null : r.type);
                  setOpen(false);
                }}
                onMouseEnter={() => setHovered(r.type)}
                onMouseLeave={() => setHovered(null)}
                className={`relative p-2 rounded-full transition-all duration-150 ease-out ${r.color} ${current === r.type ? "bg-white/10" : ""}`}
                style={{
                  transform: hovered === r.type ? "scale(1.55) translateY(-4px)" : "scale(1)",
                  filter: hovered === r.type ? `drop-shadow(0 2px 6px ${r.hex})` : undefined,
                }}
                title={r.label}
              >
                <Icon name={r.icon} size={20} filled />
                {hovered === r.type && (
                  <span
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white px-2 py-1 rounded-full whitespace-nowrap pointer-events-none"
                    style={{ background: "rgba(10,10,13,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {r.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
