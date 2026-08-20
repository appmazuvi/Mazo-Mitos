import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth.js";
import { evaluateAchievements } from "../achievements.js";

export const groupsRouter = Router();

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "grupo"
  );
}

const groupInclude = {
  owner: { select: { username: true, displayName: true, avatarUrl: true } },
  _count: { select: { members: true, posts: true } },
};

groupsRouter.get("/", optionalAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const groups = await prisma.group.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: groupInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(groups);
});

groupsRouter.get("/:slug", optionalAuth, async (req: AuthedRequest, res) => {
  const group = await prisma.group.findUnique({ where: { slug: req.params.slug }, include: groupInclude });
  if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
  const isMember = req.user
    ? !!(await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: req.user.userId } } }))
    : false;
  res.json({ ...group, isMember });
});

const createGroupSchema = z.object({ name: z.string().min(2).max(60), description: z.string().max(300).optional() });

groupsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  let slug = slugify(parsed.data.name);
  let suffix = 0;
  while (await prisma.group.findUnique({ where: { slug: suffix ? `${slug}-${suffix}` : slug } })) suffix += 1;
  if (suffix) slug = `${slug}-${suffix}`;

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      ownerId: req.user!.userId,
      members: { create: { userId: req.user!.userId, role: "OWNER" } },
    },
    include: groupInclude,
  });
  evaluateAchievements(req.user!.userId).catch(() => {});
  res.status(201).json(group);
});

groupsRouter.post("/:slug/join", requireAuth, async (req: AuthedRequest, res) => {
  const group = await prisma.group.findUnique({ where: { slug: req.params.slug } });
  if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: req.user!.userId } },
    create: { groupId: group.id, userId: req.user!.userId },
    update: {},
  });
  res.status(204).end();
});

groupsRouter.delete("/:slug/join", requireAuth, async (req: AuthedRequest, res) => {
  const group = await prisma.group.findUnique({ where: { slug: req.params.slug } });
  if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
  if (group.ownerId === req.user!.userId) return res.status(400).json({ error: "El dueño no puede abandonar el grupo" });
  await prisma.groupMember.deleteMany({ where: { groupId: group.id, userId: req.user!.userId } });
  res.status(204).end();
});

groupsRouter.get("/:slug/members", async (req, res) => {
  const group = await prisma.group.findUnique({ where: { slug: req.params.slug } });
  if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    include: { user: { select: { username: true, displayName: true, avatarUrl: true, rating: true } } },
    orderBy: { joinedAt: "asc" },
  });
  res.json(members);
});

groupsRouter.get("/:slug/feed", optionalAuth, async (req: AuthedRequest, res) => {
  const group = await prisma.group.findUnique({ where: { slug: req.params.slug } });
  if (!group) return res.status(404).json({ error: "Grupo no encontrado" });
  const posts = await prisma.post.findMany({
    where: { groupId: group.id },
    include: {
      author: { select: { username: true, displayName: true, avatarUrl: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(posts);
});
