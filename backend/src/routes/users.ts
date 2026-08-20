import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const usersRouter = Router();

usersRouter.get("/:username", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(user);
});

usersRouter.put("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { displayName, bio, avatarUrl } = req.body ?? {};
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      displayName: typeof displayName === "string" ? displayName.slice(0, 40) : undefined,
      bio: typeof bio === "string" ? bio.slice(0, 280) : undefined,
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
    },
  });
  res.json({ id: user.id, username: user.username, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl });
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
  await prisma.notification.create({
    data: { targetId: target.id, type: "FOLLOW", message: `${req.user!.username} empezó a seguirte` },
  });
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
