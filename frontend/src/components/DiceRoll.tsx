import { motion } from "framer-motion";

const MAX_DICE = 6;

// Reparte un total (ej. el ataque de una criatura) entre 1 y MAX_DICE dados
// de 6 caras para poder "tirarlo" en pantalla. Si el total no entra entero
// en esa cantidad de dados (creaturas muy potenciadas), el resto queda como
// un bonus "+N" aparte en vez de romper la matemática de los dados.
export function rollDiceForTotal(total: number): { dice: number[]; bonus: number } {
  const capped = Math.max(1, Math.round(total));
  const diceCount = Math.min(MAX_DICE, Math.ceil(capped / 6));
  const showable = Math.min(capped, diceCount * 6);
  const bonus = capped - showable;

  const dice: number[] = [];
  let remaining = showable;
  for (let i = 0; i < diceCount; i++) {
    const diceLeft = diceCount - i;
    const minForThis = Math.max(1, remaining - (diceLeft - 1) * 6);
    const maxForThis = Math.min(6, remaining - (diceLeft - 1));
    const value = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
    dice.push(value);
    remaining -= value;
  }
  return { dice, bonus };
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value }: { value: number }) {
  const pips = PIP_LAYOUTS[Math.min(6, Math.max(1, value))];
  return (
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white to-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.8)] grid grid-cols-3 grid-rows-3 gap-0.5 p-1.5">
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const active = pips.some(([r, c]) => r === row && c === col);
        return <div key={i} className={`rounded-full ${active ? "bg-[#2a1a05]" : ""}`} />;
      })}
    </div>
  );
}

export function DiceRoll({ dice, bonus }: { dice: number[]; bonus: number }) {
  const total = dice.reduce((s, v) => s + v, 0) + bonus;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center gap-2"
    >
      <div className="flex items-center gap-2">
        {dice.map((v, i) => (
          <motion.div
            key={i}
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 320, 640, 940 + i * 40] }}
            transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.06 }}
          >
            <DieFace value={v} />
          </motion.div>
        ))}
        {bonus > 0 && (
          <span className="font-thematic font-bold text-2xl text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">+{bonus}</span>
        )}
      </div>
      <span className="font-thematic font-bold text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{total}</span>
    </motion.div>
  );
}
