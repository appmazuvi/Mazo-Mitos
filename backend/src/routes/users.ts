import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth.js";
import { pushToUser } from "../realtime.js";
import { evaluateAchievements } from "../achievements.js";
import { httpUrl } from "../validators.js";

export const usersRouter = Router();

usersRouter.get("/:username", optionalAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      role: true,
      rating: true,
      peakRating: true,
      createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } },
      matchesAsP1: { select: { id: true, winnerId: true } },
      matchesAsP2: { select: { id: true, winnerId: true } },
      achievements: {
        select: { unlockedAt: true, achievement: { select: { key: true, name: true, description: true, icon: true } } },
        orderBy: { unlockedAt: "desc" },
      },
      decks: {
        where: { featured: true, isPublic: true },
        select: { id: true, name: true, cards: { include: { card: true } } },
        take: 3,
      },
    },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const finished = [...user.matchesAsP1, ...user.matchesAsP2].filter((m) => m.winnerId);
  const wins = finished.filter((m) => m.winnerId === user.id).length;
  const losses = finished.length - wins;
  const higherRated = await prisma.user.count({ where: { rating: { gt: user.rating }, banned: false } });

  const isFollowing = req.user
    ? !!(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.user.userId, followingId: user.id } } }))
    : false;

  const { matchesAsP1, matchesAsP2, ...rest } = user;
  res.json({ ...rest, wins, losses, rank: higherRated + 1, isFollowing });
});

const updateMeSchema = z.object({
  displayName: z.string().max(40).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: httpUrl.optional(),
  coverUrl: httpUrl.optional(),
});

usersRouter.put("/me", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = updateMeSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { displayName, bio, avatarUrl, coverUrl } = parsed.data;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { displayName, bio, avatarUrl, coverUrl },
  });
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
  });
});

usersRouter.post("/:username/follow", requireAuth, async (req: AuthedRequest, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
  if (target.id === req.user!.userId) return res.status(400).json({ error: "No podés seguirte a vos mismo" });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user!.userId, followingId: target.id } },
    create: { followerId: req.user!.userId, followingId: target.id },
    update: {},
  });
  const message = `${req.user!.username} empezó a seguirte`;
  await prisma.notification.create({ data: { targetId: target.id, type: "FOLLOW", message } });
  pushToUser(target.id, "notification:new", { type: "FOLLOW", message });
  evaluateAchievements(target.id).catch(() => {});
  evaluateAchievements(req.user!.userId).catch(() => {});
  res.status(204).end();
});

usersRouter.delete("/:username/follow", requireAuth, async (req: AuthedRequest, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  await prisma.follow.deleteMany({
    where: { followerId: req.user!.userId, followingId: target.id },
  });
  res.status(204).end();
});
