import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const postsRouter = Router();

const postInclude = {
  author: { select: { username: true, displayName: true, avatarUrl: true } },
  _count: { select: { comments: true, likes: true } },
};

postsRouter.get("/feed", requireAuth, async (req: AuthedRequest, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.userId },
    select: { followingId: true },
  });
  const authorIds = [...following.map((f) => f.followingId), req.user!.userId];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(posts);
});

postsRouter.get("/explore", async (_req, res) => {
  const posts = await prisma.post.findMany({
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(posts);
});

const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
  imageUrl: z.string().url().optional(),
  matchId: z.string().optional(),
  deckId: z.string().optional(),
});

postsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const post = await prisma.post.create({
    data: { authorId: req.user!.userId, ...parsed.data },
    include: postInclude,
  });
  res.status(201).json(post);
});

postsRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || post.authorId !== req.user!.userId) return res.status(404).json({ error: "Post no encontrado" });
  await prisma.post.delete({ where: { id: post.id } });
  res.status(204).end();
});

postsRouter.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post no encontrado" });

  await prisma.like.upsert({
    where: { postId_userId: { postId: post.id, userId: req.user!.userId } },
    create: { postId: post.id, userId: req.user!.userId },
    update: {},
  });
  if (post.authorId !== req.user!.userId) {
    await prisma.notification.create({
      data: { targetId: post.authorId, type: "LIKE", message: `${req.user!.username} le dio like a tu post` },
    });
  }
  res.status(204).end();
});

postsRouter.delete("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.like.deleteMany({ where: { postId: req.params.id, userId: req.user!.userId } });
  res.status(204).end();
});

const commentSchema = z.object({ content: z.string().min(1).max(500) });

postsRouter.get("/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(comments);
});

postsRouter.post("/:id/comments", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post no encontrado" });

  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: req.user!.userId, content: parsed.data.content },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
  });
  if (post.authorId !== req.user!.userId) {
    await prisma.notification.create({
      data: { targetId: post.authorId, type: "COMMENT", message: `${req.user!.username} comentó tu post` },
    });
  }
  res.status(201).json(comment);
});
