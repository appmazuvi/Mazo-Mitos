import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth.js";
import { pushToUser } from "../realtime.js";

export const postsRouter = Router();

const postInclude = {
  author: { select: { username: true, displayName: true, avatarUrl: true } },
  _count: { select: { comments: true, likes: true } },
};

async function attachLikedByMe<T extends { id: string }>(posts: T[], userId?: string) {
  if (!userId || posts.length === 0) return posts.map((p) => ({ ...p, likedByMe: false }));
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true },
  });
  const likedSet = new Set(likes.map((l) => l.postId));
  return posts.map((p) => ({ ...p, likedByMe: likedSet.has(p.id) }));
}

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
  res.json(await attachLikedByMe(posts, req.user!.userId));
});

postsRouter.get("/explore", optionalAuth, async (req: AuthedRequest, res) => {
  const posts = await prisma.post.findMany({
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(await attachLikedByMe(posts, req.user?.userId));
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
  res.status(201).json({ ...post, likedByMe: false });
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
    const message = `${req.user!.username} le dio like a tu post`;
    await prisma.notification.create({ data: { targetId: post.authorId, type: "LIKE", message } });
    pushToUser(post.authorId, "notification:new", { type: "LIKE", message });
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
    const message = `${req.user!.username} comentó tu post`;
    await prisma.notification.create({ data: { targetId: post.authorId, type: "COMMENT", message } });
    pushToUser(post.authorId, "notification:new", { type: "COMMENT", message });
  }
  res.status(201).json(comment);
});
