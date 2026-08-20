import { useState } from "react";
import { Icon } from "./Icon";
import type { ReactionType } from "../types";

const REACTIONS: { type: ReactionType; icon: "heartFilled" | "flame" | "smile" | "wow"; color: string }[] = [
  { type: "LIKE", icon: "heartFilled", color: "text-rose-400" },
  { type: "LOVE", icon: "heartFilled", color: "text-pink-400" },
  { type: "FIRE", icon: "flame", color: "text-orange-400" },
  { type: "LAUGH", icon: "smile", color: "text-amber-300" },
  { type: "WOW", icon: "wow", color: "text-arcane-300" },
];

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
  const active = REACTIONS.find((r) => r.type === current);

  return (
    <div className="relative">
      <button
        onClick={() => onReact(current ? null : "LIKE")}
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
              title={r.type}
            >
              <Icon name={r.icon} size={18} filled />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
