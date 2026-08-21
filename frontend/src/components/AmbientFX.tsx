import { useMemo } from "react";

export type AmbientTheme = "fuego" | "viento" | "lluvia" | "tierra" | "vacio" | null;

const THEME_CONFIG: Record<
  Exclude<AmbientTheme, null>,
  { count: number; render: (seed: number) => { style: React.CSSProperties; className: string } }
> = {
  fuego: {
    count: 18,
    render: (i) => ({
      className: "ambient-ember",
      style: {
        left: `${(i * 37) % 100}%`,
        animationDelay: `${(i % 9) * 0.4}s`,
        animationDuration: `${3 + (i % 5) * 0.5}s`,
      },
    }),
  },
  lluvia: {
    count: 26,
    render: (i) => ({
      className: "ambient-rain",
      style: {
        left: `${(i * 23) % 100}%`,
        animationDelay: `${(i % 10) * 0.15}s`,
        animationDuration: `${0.6 + (i % 4) * 0.1}s`,
      },
    }),
  },
  viento: {
    count: 12,
    render: (i) => ({
      className: "ambient-wind",
      style: {
        top: `${(i * 17) % 100}%`,
        animationDelay: `${(i % 6) * 0.5}s`,
        animationDuration: `${2 + (i % 4) * 0.4}s`,
      },
    }),
  },
  tierra: {
    count: 14,
    render: (i) => ({
      className: "ambient-dust",
      style: {
        left: `${(i * 29) % 100}%`,
        animationDelay: `${(i % 7) * 0.6}s`,
        animationDuration: `${4 + (i % 5) * 0.6}s`,
      },
    }),
  },
  vacio: {
    count: 14,
    render: (i) => ({
      className: "ambient-void",
      style: {
        left: `${(i * 31) % 100}%`,
        animationDelay: `${(i % 8) * 0.5}s`,
        animationDuration: `${3.5 + (i % 5) * 0.5}s`,
      },
    }),
  },
};

export function AmbientFX({ theme }: { theme: AmbientTheme }) {
  const particles = useMemo(() => {
    if (!theme) return [];
    const cfg = THEME_CONFIG[theme];
    return Array.from({ length: cfg.count }, (_, i) => cfg.render(i));
  }, [theme]);

  if (!theme) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-0">
      {particles.map((p, i) => (
        <div key={i} className={p.className} style={p.style} />
      ))}
    </div>
  );
}
