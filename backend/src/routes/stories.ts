import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { httpUrl } from "../validators.js";

export const storiesRouter = Router();

storiesRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const following = await prisma.follow.findMany({ where: { followerId: req.user!.userId }, select: { followingId: true } });
  const authorIds = [...following.map((f) => f.followingId), req.user!.userId];

  const stories = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  const byAuthor = new Map<string, typeof stories>();
  for (const story of stories) {
    const list = byAuthor.get(story.authorId) ?? [];
    list.push(story);
    byAuthor.set(story.authorId, list);
  }

  res.json([...byAuthor.values()].map((list) => ({ author: list[0].author, authorId: list[0].authorId, stories: list })));
});

const createStorySchema = z.object({ imageUrl: httpUrl, caption: z.string().max(200).optional() });

storiesRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createStorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const story = await prisma.story.create({
    data: {
      authorId: req.user!.userId,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
  });
  res.status(201).json(story);
});
