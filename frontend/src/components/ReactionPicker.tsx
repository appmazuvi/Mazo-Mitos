import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { ReactionType } from "../types";

const REACTIONS: { type: ReactionType; icon: "heartFilled" | "gem" | "flame" | "impact" | "spark"; label: string; color: string }[] = [
  { type: "LIKE", icon: "heartFilled", label: "Me gusta", color: "text-rose-400" },
  { type: "LOVE", icon: "gem", label: "Me encanta", color: "text-pink-400" },
  { type: "FIRE", icon: "flame", label: "Está en llamas", color: "text-orange-400" },
  { type: "LAUGH", icon: "impact", label: "Me hace reír", color: "text-amber-300" },
  { type: "WOW", icon: "spark", label: "Impresionante", color: "text-arcane-300" },
];

const LONG_PRESS_MS = 350;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
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

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPress = () => {
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      setOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    clearTimer();
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
    <div className="relative" ref={rootRef}>
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onContextMenu={(e) => e.preventDefault()}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`flex items-center gap-1.5 text-sm ${active ? active.color : "text-white/50"}`}
      >
        <Icon name={active ? active.icon : "heart"} size={17} filled={!!active} />
        {total}
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-full left-0 mb-1 flex gap-1 card-surface p-1.5 z-20"
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => {
                onReact(current === r.type ? null : r.type);
                setOpen(false);
              }}
              className={`p-1.5 rounded-lg hover:bg-white/10 hover:scale-125 transition ${r.color} ${current === r.type ? "bg-white/10" : ""}`}
              title={r.label}
            >
              <Icon name={r.icon} size={18} filled />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
