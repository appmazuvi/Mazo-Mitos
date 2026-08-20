import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../auth.js";

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
  imageUrl: z.string().url().nullable().optional(),
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
