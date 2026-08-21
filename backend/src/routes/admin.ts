import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../auth.js";
import { httpUrl } from "../validators.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

// ---------- Métricas ----------
adminRouter.get("/metrics", async (_req, res) => {
  const [userCount, matchCount, postCount, cardCount, deckCount, matchesToday, topCardsRaw] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.post.count(),
    prisma.card.count(),
    prisma.deck.count(),
    prisma.match.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.deckCard.groupBy({ by: ["cardId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
  ]);

  const topCards = await Promise.all(
    topCardsRaw.map(async (tc) => {
      const card = await prisma.card.findUnique({ where: { id: tc.cardId } });
      return { card, count: tc._sum.quantity ?? 0 };
    })
  );

  const usersLast7Days = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT to_char("createdAt", 'YYYY-MM-DD') as day, count(*)::bigint as count
    FROM "User"
    WHERE "createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY day ORDER BY day ASC
  `;

  res.json({
    userCount,
    matchCount,
    postCount,
    cardCount,
    deckCount,
    matchesToday,
    topCards,
    usersLast7Days: usersLast7Days.map((r) => ({ day: r.day, count: Number(r.count) })),
  });
});

// ---------- Cartas ----------
const cardSchema = z.object({
  name: z.string().min(1).max(60),
  cost: z.number().int().min(0).max(15),
  type: z.enum(["CREATURE", "SPELL"]),
  attack: z.number().int().min(0).nullable().optional(),
  health: z.number().int().min(1).nullable().optional(),
  rarity: z.enum(["COMUN", "RARA", "EPICA", "LEGENDARIA"]),
  effectKey: z.string().max(40).nullable().optional(),
  description: z.string().min(1).max(300),
  imageUrl: httpUrl.nullable().optional(),
  set: z.string().max(60).nullable().optional(),
  code: z.string().max(30).nullable().optional(),
});

adminRouter.post("/cards", async (req, res) => {
  const parsed = cardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const card = await prisma.card.create({ data: parsed.data });
  res.status(201).json(card);
});

adminRouter.put("/cards/:id", async (req, res) => {
  const parsed = cardSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const card = await prisma.card.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(card);
});

adminRouter.delete("/cards/:id", async (req, res) => {
  await prisma.deckCard.deleteMany({ where: { cardId: req.params.id } });
  await prisma.card.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---------- Carga masiva de cartas por CSV o JSON ----------
const VALID_TYPES = ["CREATURE", "SPELL"] as const;
const VALID_RARITIES = ["COMUN", "RARA", "EPICA", "LEGENDARIA"] as const;

interface BulkRowOk {
  ok: true;
  row: number;
  name: string;
  data: {
    name: string;
    cost: number;
    type: (typeof VALID_TYPES)[number];
    attack: number | null;
    health: number | null;
    rarity: (typeof VALID_RARITIES)[number];
    effectKey: string | null;
    description: string;
    set: string | null;
    code: string | null;
    imageUrl: string | null;
  };
}
interface BulkRowError {
  ok: false;
  row: number;
  name?: string;
  error: string;
}

function toStr(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

// Acepta tanto una fila de CSV (siempre strings) como un objeto de un array
// JSON (valores ya tipados) — se normalizan a texto antes de validar.
function parseCardRow(raw: Record<string, unknown>, row: number, defaultSet?: string): BulkRowOk | BulkRowError {
  const name = toStr(raw.name);
  if (!name) return { ok: false, row, error: "Falta el nombre" };
  if (name.length > 60) return { ok: false, row, name, error: "Nombre demasiado largo (máx. 60 caracteres)" };

  const costRaw = toStr(raw.cost);
  const cost = Number(costRaw);
  if (!costRaw || !Number.isInteger(cost) || cost < 0 || cost > 15) {
    return { ok: false, row, name, error: "Costo inválido (debe ser un entero de 0 a 15)" };
  }

  const type = toStr(raw.type).toUpperCase();
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { ok: false, row, name, error: `Tipo inválido "${toStr(raw.type)}" (usar CREATURE o SPELL)` };
  }

  const rarity = toStr(raw.rarity).toUpperCase();
  if (!VALID_RARITIES.includes(rarity as (typeof VALID_RARITIES)[number])) {
    return { ok: false, row, name, error: `Rareza inválida "${toStr(raw.rarity)}" (usar COMUN, RARA, EPICA o LEGENDARIA)` };
  }

  const description = toStr(raw.description);
  if (!description) return { ok: false, row, name, error: "Falta la descripción" };
  if (description.length > 300) return { ok: false, row, name, error: "Descripción demasiado larga (máx. 300 caracteres)" };

  let attack: number | null = null;
  let health: number | null = null;
  if (type === "CREATURE") {
    const atkRaw = toStr(raw.attack);
    const hpRaw = toStr(raw.health);
    attack = atkRaw === "" ? 0 : Number(atkRaw);
    health = hpRaw === "" ? 1 : Number(hpRaw);
    if (!Number.isInteger(attack) || attack < 0) return { ok: false, row, name, error: "Ataque inválido" };
    if (!Number.isInteger(health) || health < 1) return { ok: false, row, name, error: "Vida inválida (mínimo 1)" };
  }

  const effectKey = toStr(raw.effectKey) || null;
  if (effectKey && effectKey.length > 40) return { ok: false, row, name, error: "effectKey demasiado largo" };

  // "edition" además de "set" para que sirva un archivo que use ese nombre de
  // columna; si la fila no trae ninguno, se usa el nombre de colección que se
  // haya puesto para todo el lote en el formulario de subida.
  const set = toStr(raw.set) || toStr(raw.edition) || defaultSet || null;
  if (set && set.length > 60) return { ok: false, row, name, error: "Nombre de colección demasiado largo (máx. 60 caracteres)" };

  const code = toStr(raw.code) || null;
  if (code && code.length > 30) return { ok: false, row, name, error: "Código demasiado largo (máx. 30 caracteres)" };

  const imageUrlRaw = toStr(raw.imageUrl);
  let imageUrl: string | null = null;
  if (imageUrlRaw) {
    if (!/^https?:\/\//.test(imageUrlRaw)) {
      return { ok: false, row, name, error: "imageUrl debe empezar con http:// o https://" };
    }
    imageUrl = imageUrlRaw;
  }

  return {
    ok: true,
    row,
    name,
    data: {
      name,
      cost,
      type: type as (typeof VALID_TYPES)[number],
      attack,
      health,
      rarity: rarity as (typeof VALID_RARITIES)[number],
      effectKey,
      description,
      set,
      code,
      imageUrl,
    },
  };
}

const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

adminRouter.post("/cards/bulk", bulkUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

  const filename = req.file.originalname.toLowerCase();
  const isJson = filename.endsWith(".json") || req.file.mimetype === "application/json";
  const defaultSet = typeof req.body?.defaultSet === "string" ? req.body.defaultSet.trim() || undefined : undefined;

  let records: Record<string, unknown>[];
  try {
    if (isJson) {
      const parsed = JSON.parse(req.file.buffer.toString("utf-8"));
      if (!Array.isArray(parsed)) throw new Error("el archivo debe ser un array de cartas");
      records = parsed;
    } else {
      records = parse(req.file.buffer, { columns: true, trim: true, skip_empty_lines: true, bom: true });
    }
  } catch (err) {
    return res.status(400).json({ error: "No se pudo leer el archivo: " + (err instanceof Error ? err.message : "formato inválido") });
  }

  if (records.length === 0) return res.status(400).json({ error: "El archivo no tiene cartas" });

  // En CSV la fila 1 es el encabezado, así que los datos arrancan en la 2; en
  // JSON no hay encabezado, así que el primer elemento ya es el número 1.
  const rowOffset = isJson ? 1 : 2;
  const results = records.map((r, i) => parseCardRow(r, i + rowOffset, defaultSet));
  const errors = results.filter((r): r is BulkRowError => !r.ok);
  const valid = results.filter((r): r is BulkRowOk => r.ok);

  let created = 0;
  let updated = 0;
  for (const r of valid) {
    const existing = await prisma.card.findUnique({ where: { name: r.data.name } });
    if (existing) {
      await prisma.card.update({ where: { id: existing.id }, data: r.data });
      updated += 1;
    } else {
      await prisma.card.create({ data: r.data });
      created += 1;
    }
  }

  res.json({
    created,
    updated,
    errors: errors.map(({ row, name, error }) => ({ row, name, error })),
  });
});

// ---------- Usuarios ----------
adminRouter.get("/users", async (req, res) => {
  const search = typeof req.query.q === "string" ? req.query.q : undefined;
  const users = await prisma.user.findMany({
    where: search ? { OR: [{ username: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : undefined,
    select: {
      id: true, username: true, displayName: true, email: true, role: true, banned: true, banReason: true, createdAt: true,
      _count: { select: { posts: true, decks: true, matchesAsP1: true, matchesAsP2: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(users);
});

const banSchema = z.object({ reason: z.string().max(200).optional() });

adminRouter.post("/users/:id/ban", async (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.userId) return res.status(400).json({ error: "No podés banearte a vos mismo" });
  const parsed = banSchema.safeParse(req.body ?? {});
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { banned: true, banReason: parsed.success ? parsed.data.reason ?? null : null },
  });
  res.json({ id: user.id, banned: user.banned, banReason: user.banReason });
});

adminRouter.post("/users/:id/unban", async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { banned: false, banReason: null } });
  res.json({ id: user.id, banned: user.banned });
});

adminRouter.post("/users/:id/role", async (req: AuthedRequest, res) => {
  const parsed = z.object({ role: z.enum(["USER", "ADMIN"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Rol inválido" });
  if (req.params.id === req.user!.userId) return res.status(400).json({ error: "No podés cambiar tu propio rol" });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: parsed.data.role } });
  res.json({ id: user.id, role: user.role });
});

// ---------- Moderación ----------
adminRouter.delete("/posts/:id", async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

adminRouter.delete("/comments/:id", async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
