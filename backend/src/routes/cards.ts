import { Router } from "express";
import { prisma } from "../prisma.js";

export const cardsRouter = Router();

cardsRouter.get("/", async (_req, res) => {
  const cards = await prisma.card.findMany({ orderBy: [{ cost: "asc" }, { name: "asc" }] });
  res.json(cards);
});
