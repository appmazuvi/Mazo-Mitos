import { Router } from "express";
import { prisma } from "../prisma.js";

export const searchRouter = Router();

searchRouter.get("/users", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) return res.json([]);
  const users = await prisma.user.findMany({
    where: {
      banned: false,
      OR: [{ username: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
    take: 20,
  });
  res.json(users);
});

searchRouter.get("/decks", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const decks = await prisma.deck.findMany({
    where: {
      isPublic: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      owner: { select: { username: true, displayName: true, avatarUrl: true } },
      cards: { include: { card: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  res.json(decks);
});

searchRouter.get("/leaderboard", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { banned: false },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      _count: { select: { matchesWon: true } },
    },
    take: 200,
  });
  const ranked = users
    .map((u) => ({ ...u, wins: u._count.matchesWon }))
    .filter((u) => u.wins > 0)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 20);
  res.json(ranked);
});
