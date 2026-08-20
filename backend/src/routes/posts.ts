import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth.js";
import { pushToUser } from "../realtime.js";
import { evaluateAchievements } from "../achievements.js";
import { httpUrl } from "../validators.js";

export const postsRouter = Router();

const REACTION_TYPES = ["LIKE", "LOVE", "FIRE", "LAUGH", "WOW"] as const;

const postInclude = {
  author: { select: { username: true, displayName: true, avatarUrl: true } },
  group: { select: { slug: true, name: true, avatarUrl: true } },
  _count: { select: { comments: true, likes: true } },
};

async function attachReactions<T extends { id: string }>(posts: T[], userId?: string) {
  if (posts.length === 0) return posts.map((p) => ({ ...p, myReaction: null as string | null, reactionCounts: {} as Record<string, number> }));
  const postIds = posts.map((p) => p.id);

  const allReactions = await prisma.like.findMany({ where: { postId: { in: postIds } }, select: { postId: true, userId: true, type: true } });
  const countsByPost = new Map<string, Record<string, number>>();
  const mineByPost = new Map<string, string>();
  for (const r of allReactions) {
    const counts = countsByPost.get(r.postId) ?? {};
    counts[r.type] = (counts[r.type] ?? 0) + 1;
    countsByPost.set(r.postId, counts);
    if (userId && r.userId === userId) mineByPost.set(r.postId, r.type);
  }

  return posts.map((p) => ({ ...p, myReaction: mineByPost.get(p.id) ?? null, reactionCounts: countsByPost.get(p.id) ?? {} }));
}

postsRouter.get("/feed", requireAuth, async (req: AuthedRequest, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.userId },
    select: { followingId: true },
  });
  const authorIds = [...following.map((f) => f.followingId), req.user!.userId];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds }, groupId: null },
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(await attachReactions(posts, req.user!.userId));
});

postsRouter.get("/explore", optionalAuth, async (req: AuthedRequest, res) => {
  const candidates = await prisma.post.findMany({
    where: { groupId: null },
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const now = Date.now();
  const ranked = candidates
    .map((p) => {
      const hoursOld = Math.max(1, (now - p.createdAt.getTime()) / 3_600_000);
      const score = (p._count.likes * 1 + p._count.comments * 2) / hoursOld ** 0.6;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((r) => r.post);

  res.json(await attachReactions(ranked, req.user?.userId));
});

const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
  imageUrl: httpUrl.optional(),
  images: z.array(httpUrl).max(6).optional(),
  matchId: z.string().optional(),
  deckId: z.string().optional(),
  groupId: z.string().optional(),
});

postsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  if (parsed.data.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: parsed.data.groupId, userId: req.user!.userId } },
    });
    if (!membership) return res.status(403).json({ error: "No sos miembro de este grupo" });
  }

  const images = parsed.data.images ?? (parsed.data.imageUrl ? [parsed.data.imageUrl] : []);

  const post = await prisma.post.create({
    data: { authorId: req.user!.userId, ...parsed.data, images, imageUrl: images[0] },
    include: postInclude,
  });
  evaluateAchievements(req.user!.userId).catch(() => {});
  res.status(201).json({ ...post, myReaction: null, reactionCounts: {} });
});

postsRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || post.authorId !== req.user!.userId) return res.status(404).json({ error: "Post no encontrado" });
  await prisma.post.delete({ where: { id: post.id } });
  res.status(204).end();
});

const reactSchema = z.object({ type: z.enum(REACTION_TYPES).optional() });

postsRouter.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post no encontrado" });
  const parsed = reactSchema.safeParse(req.body ?? {});
  const type = parsed.success && parsed.data.type ? parsed.data.type : "LIKE";

  await prisma.like.upsert({
    where: { postId_userId: { postId: post.id, userId: req.user!.userId } },
    create: { postId: post.id, userId: req.user!.userId, type },
    update: { type },
  });
  if (post.authorId !== req.user!.userId) {
    const message = `${req.user!.username} reaccionó a tu post`;
    await prisma.notification.create({ data: { targetId: post.authorId, type: "LIKE", message } });
    pushToUser(post.authorId, "notification:new", { type: "LIKE", message });
  }
  res.status(204).end();
});

postsRouter.delete("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.like.deleteMany({ where: { postId: req.params.id, userId: req.user!.userId } });
  res.status(204).end();
});

const commentSchema = z.object({ content: z.string().min(1).max(500), parentId: z.string().optional() });

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
    data: { postId: post.id, authorId: req.user!.userId, content: parsed.data.content, parentId: parsed.data.parentId },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
  });
  if (post.authorId !== req.user!.userId) {
    const message = `${req.user!.username} comentó tu post`;
    await prisma.notification.create({ data: { targetId: post.authorId, type: "COMMENT", message } });
    pushToUser(post.authorId, "notification:new", { type: "COMMENT", message });
  }
  res.status(201).json(comment);
});
