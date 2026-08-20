import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { targetId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

notificationsRouter.post("/read-all", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.notification.updateMany({
    where: { targetId: req.user!.userId, read: false },
    data: { read: true },
  });
  res.status(204).end();
});
