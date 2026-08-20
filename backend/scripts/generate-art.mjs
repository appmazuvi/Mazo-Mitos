import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { FACTION_CARD_NAMES } from "../prisma/cardArt.js";

const prisma = new PrismaClient();

const FACTION_THEME = {
  ignis: "fire and lava elemental theme, volcanic embers, molten glow, warm red-orange-gold color palette",
  abisal: "deep ocean water elemental theme, aquatic, flowing currents, teal-blue color palette",
  terra: "earth and stone elemental theme, forest roots or mountain rock, green-brown color palette",
  cefiro: "wind and sky elemental theme, storm clouds, lightning, cyan-white color palette",
  void: "arcane dark-magic elemental theme, cosmic void, mystical purple-violet energy",
};

const RARITY_FLOURISH = {
  COMUN: "",
  RARA: "skilled and notable, ",
  EPICA: "powerful and imposing, ",
  LEGENDARIA: "godlike and awe-inspiring, legendary hero composition, ",
};

function nameToFaction(name) {
  for (const [faction, names] of Object.entries(FACTION_CARD_NAMES)) {
    if (names.includes(name)) return faction;
  }
  return "void";
}

function buildPrompt(card) {
  const faction = nameToFaction(card.name);
  const theme = FACTION_THEME[faction];
  const flourish = RARITY_FLOURISH[card.rarity] ?? "";
  const subjectFrame = card.type === "SPELL" ? "magical spell effect illustration of" : "character portrait illustration of";
  return `Epic fantasy trading card game art, ${subjectFrame} ${flourish}${card.description} (named "${card.name}"), ${theme}, digital painting, dramatic lighting, highly detailed, vibrant saturated colors, painted art style like Magic the Gathering, single centered subject, no text, no watermark, no signature, no border, no frame`;
}

async function generateOne(card) {
  const prompt = buildPrompt(card);
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(buf).metadata();
  const cropHeight = Math.round((meta.height ?? 1024) * 0.92);

  const processed = await sharp(buf)
    .extract({ left: 0, top: 0, width: meta.width ?? 1024, height: cropHeight })
    .resize({ width: 480 })
    .jpeg({ quality: 78 })
    .toBuffer();

  const dataUri = `data:image/jpeg;base64,${processed.toString("base64")}`;
  await prisma.card.update({ where: { id: card.id }, data: { imageUrl: dataUri } });
  return dataUri.length;
}

async function main() {
  const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;
  const allCards = await prisma.card.findMany({ orderBy: { name: "asc" } });
  const cards = limit ? allCards.slice(0, limit) : allCards;
  console.log(`Generando arte para ${cards.length} cartas...`);

  let done = 0;
  let failed = 0;
  for (const card of cards) {
    try {
      const size = await generateOne(card);
      done += 1;
      console.log(`[${done}/${cards.length}] OK  ${card.name}  (${(size / 1024).toFixed(0)}KB)`);
    } catch (err) {
      failed += 1;
      console.log(`[${done + failed}/${cards.length}] FAIL ${card.name}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nListo. ${done} generadas, ${failed} fallidas.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
