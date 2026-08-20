interface Faction {
  bg1: string;
  bg2: string;
  bg3: string;
  accent: string;
}

const FACTIONS: Record<string, Faction> = {
  ignis: { bg1: "#4a0f05", bg2: "#7a1f0a", bg3: "#1a0502", accent: "#ff8a3d" },
  abisal: { bg1: "#052a3d", bg2: "#0a4a66", bg3: "#01121c", accent: "#5fd4ff" },
  terra: { bg1: "#1f2a0f", bg2: "#3d4d1a", bg3: "#0d1206", accent: "#a3d060" },
  cefiro: { bg1: "#0f2740", bg2: "#1e4d70", bg3: "#040f1a", accent: "#bfe8ff" },
  void: { bg1: "#20083d", bg2: "#3d1466", bg3: "#0a021a", accent: "#c98bff" },
};

const RARITY_GLOW: Record<string, string> = {
  COMUN: "#9aa0b4",
  RARA: "#4fa3ff",
  EPICA: "#b06bff",
  LEGENDARIA: "#e8b64c",
};

const GLYPHS: Record<string, string> = {
  flame: "M12 2c-1.2 3.6-4.8 4.6-4.8 8.4a4.8 4.8 0 0 0 9.6 0c0-1.8-.9-2.8-1.8-3.7.4 1.9-.9 2.9-1.9 2.4.6-2.1-.4-3.9-1.1-7.1z",
  sword: "M11.2 2h1.6v11.5h-1.6zM9 15h6l-.9 2.6h-4.2zM12 20.5l-1.4 1.5h2.8z",
  claw: "M4 6c3 1 4 4 4 7M9 4c2.5 1.5 3 5 2.5 8.5M14 4.5c2 2 2 5.5 1 9",
  shield: "M12 2 4 5v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V5z",
  wave: "M2 14c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6-0 2-2.5 4 0v6H2z M2 9c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 6 0v4c-2 2.2-4 2.2-6 0s-4-2.2-6 0-4 2.2-6 0z",
  droplet: "M12 2c3 4.5 6.5 8.4 6.5 12A6.5 6.5 0 0 1 5.5 14C5.5 10.4 9 6.5 12 2z",
  tentacle: "M4 4c6 0 3 6 8 6s2-6 8-6M4 10c6 0 3 6 8 6s2-6 8-6M4 16c5 0 3 5 7 5",
  thorn: "M12 2c5 3 6 8 6 12a6 6 0 0 1-12 0c0-4 1-9 6-12zM12 4v16",
  mountain: "M2 19 9 6l4 6 2-3 7 10z",
  tree: "M12 2 6 10h3l-4 6h4l-3 6h12l-3-6h4l-4-6h3z",
  wing: "M2 14c5-1 8-5 9-11 1 6 4 9 9 8-4 3-9 3-9 8-2-4-6-6-9-5z",
  windspiral: "M12 2a10 10 0 1 0 7 17M12 6a6 6 0 1 1-5 9M12 10a2 2 0 1 0 2 2",
  feather: "M12 2c4 3 5 9 3 16-3-1-6-4-7-8-1-4 1-7 4-8zM10 8l5 1M9 12l5 1M8.5 16l4.5.5",
  eye: "M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  star: "M12 2l2.7 6.4L22 9l-5.2 4.6L18.2 21 12 17.1 5.8 21l1.4-7.4L2 9l7.3-.6z",
  crystal: "M12 1l6 4-2 6-4 12-4-12-2-6z M6 5l12 0 M4 11l16 0",
  lightning: "M13 1 4 14h6l-1 9 9-13h-6z",
  meteor: "M20 4 9 15a4 4 0 1 0 3-3zM14 3l2 2M17 6l2 2M11 3l7 7",
  skull: "M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6.3V19h2v-2h1.5v2h3v-2H15v2h2v-2.7c1.5-1.3 3-3.3 3-6.3a8 8 0 0 0-8-8zM9 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM15 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
};

const CARD_ART: Record<string, { faction: keyof typeof FACTIONS; glyph: keyof typeof GLYPHS }> = {
  "Chispa Errante": { faction: "ignis", glyph: "flame" },
  "Recluta de Ignis": { faction: "ignis", glyph: "sword" },
  "Salamandra Feroz": { faction: "ignis", glyph: "claw" },
  "Bola de Fuego": { faction: "ignis", glyph: "flame" },
  "Centinela de Brasas": { faction: "ignis", glyph: "shield" },
  "Furia Volcánica": { faction: "ignis", glyph: "flame" },
  "Señor de las Llamas": { faction: "ignis", glyph: "flame" },
  "Ignareth, el Eterno": { faction: "ignis", glyph: "wing" },

  "Pez Espada Menor": { faction: "abisal", glyph: "wave" },
  "Sacerdotisa Abisal": { faction: "abisal", glyph: "droplet" },
  "Marea Curativa": { faction: "abisal", glyph: "droplet" },
  "Kraken Juvenil": { faction: "abisal", glyph: "tentacle" },
  "Guardiana de Marea": { faction: "abisal", glyph: "shield" },
  "Bendición del Océano": { faction: "abisal", glyph: "droplet" },
  "Leviatán de las Profundidades": { faction: "abisal", glyph: "tentacle" },
  "Nayadel, Señora del Abismo": { faction: "abisal", glyph: "wave" },

  "Brote Espinoso": { faction: "terra", glyph: "thorn" },
  "Golem de Barro": { faction: "terra", glyph: "mountain" },
  "Muro de Raíces": { faction: "terra", glyph: "thorn" },
  "Oso Ancestral": { faction: "terra", glyph: "claw" },
  "Coloso de Piedra": { faction: "terra", glyph: "mountain" },
  "Grito de la Montaña": { faction: "terra", glyph: "mountain" },
  "Titán Sismico": { faction: "terra", glyph: "mountain" },
  "Gaiathor, Corazón del Mundo": { faction: "terra", glyph: "tree" },

  "Halcón Veloz": { faction: "cefiro", glyph: "wing" },
  "Explorador del Viento": { faction: "cefiro", glyph: "windspiral" },
  "Ráfaga Cortante": { faction: "cefiro", glyph: "windspiral" },
  "Arquera de las Nubes": { faction: "cefiro", glyph: "feather" },
  "Robo de Sabiduría": { faction: "cefiro", glyph: "eye" },
  "Grifo Tormentoso": { faction: "cefiro", glyph: "wing" },
  "Fénix de Céfiro": { faction: "cefiro", glyph: "wing" },
  "Aerin, la Tempestad Viva": { faction: "cefiro", glyph: "windspiral" },

  "Susurro del Vacío": { faction: "void", glyph: "eye" },
  "Aprendiz Arcano": { faction: "void", glyph: "star" },
  "Escudo Etéreo": { faction: "void", glyph: "shield" },
  "Golpe del Vacío": { faction: "void", glyph: "lightning" },
  "Devorador de Almas": { faction: "void", glyph: "skull" },
  "Aniquilación": { faction: "void", glyph: "star" },
  "Tormenta de Meteoros": { faction: "void", glyph: "meteor" },
  "Nyxandra, Devoradora de Mundos": { faction: "void", glyph: "skull" },
};

export function generateCardArt(cardName: string, rarity: string): string {
  const entry = CARD_ART[cardName] ?? { faction: "void" as const, glyph: "star" as const };
  const f = FACTIONS[entry.faction];
  const glow = RARITY_GLOW[rarity] ?? RARITY_GLOW.COMUN;
  const glyphPath = GLYPHS[entry.glyph];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%">
<stop offset="0%" stop-color="${f.bg2}"/>
<stop offset="55%" stop-color="${f.bg1}"/>
<stop offset="100%" stop-color="${f.bg3}"/>
</radialGradient>
<radialGradient id="glow" cx="50%" cy="45%" r="35%">
<stop offset="0%" stop-color="${glow}" stop-opacity="0.55"/>
<stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
</radialGradient>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
<feGaussianBlur stdDeviation="5"/>
</filter>
</defs>
<rect width="240" height="160" fill="url(#bg)"/>
<circle cx="120" cy="72" r="55" fill="url(#glow)"/>
${Array.from({ length: 8 })
  .map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const r = 68;
    const x = 120 + Math.cos(angle) * r;
    const y = 72 + Math.sin(angle) * r * 0.72;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${f.accent}" opacity="0.35"/>`;
  })
  .join("")}
<circle cx="120" cy="72" r="46" fill="none" stroke="${f.accent}" stroke-opacity="0.25" stroke-width="1"/>
<g filter="url(#blur)" opacity="0.7" fill="${glow}">
<g transform="translate(88,42) scale(2.2)">
<path d="${glyphPath}"/>
</g>
</g>
<g fill="none" stroke="${f.accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">
<g transform="translate(88,42) scale(2.2)">
<path d="${glyphPath}" fill="${f.accent}" fill-opacity="0.15"/>
</g>
</g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
