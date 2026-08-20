import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { pushToUser } from "../realtime.js";

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

async function getOrCreateConversation(userAId: string, userBId: string) {
  const [a, b] = [userAId, userBId].sort();
  return prisma.conversation.upsert({
    where: { participantAId_participantBId: { participantAId: a, participantBId: b } },
    create: { participantAId: a, participantBId: b },
    update: {},
  });
}

messagesRouter.get("/", async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participantAId: userId }, { participantBId: userId }] },
    include: {
      participantA: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      participantB: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const otherUser = c.participantAId === userId ? c.participantB : c.participantA;
      const unread = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
      });
      return {
        id: c.id,
        otherUser,
        lastMessage: c.messages[0] ?? null,
        unread,
      };
    })
  );

  withUnread.sort((a, b) => {
    const at = a.lastMessage?.createdAt ?? 0;
    const bt = b.lastMessage?.createdAt ?? 0;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  res.json(withUnread);
});

messagesRouter.get("/:username", async (req: AuthedRequest, res) => {
  const other = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!other) return res.status(404).json({ error: "Usuario no encontrado" });

  const conversation = await getOrCreateConversation(req.user!.userId, other.id);
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderId: other.id, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({
    conversationId: conversation.id,
    otherUser: { id: other.id, username: other.username, displayName: other.displayName, avatarUrl: other.avatarUrl },
    messages,
  });
});

const sendSchema = z.object({ content: z.string().min(1).max(1000) });

messagesRouter.post("/:username", async (req: AuthedRequest, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const other = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!other) return res.status(404).json({ error: "Usuario no encontrado" });
  if (other.id === req.user!.userId) return res.status(400).json({ error: "No podés enviarte mensajes a vos mismo" });

  const conversation = await getOrCreateConversation(req.user!.userId, other.id);
  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: req.user!.userId, content: parsed.data.content },
  });

  pushToUser(other.id, "message:new", { conversationId: conversation.id, message, from: req.user!.username });
  await prisma.notification.create({
    data: { targetId: other.id, type: "MESSAGE", message: `${req.user!.username} te envió un mensaje` },
  });
  pushToUser(other.id, "notification:new", { type: "MESSAGE", message: `${req.user!.username} te envió un mensaje` });

  res.status(201).json(message);
});
