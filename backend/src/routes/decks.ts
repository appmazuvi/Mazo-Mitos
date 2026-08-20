import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../auth.js";

export const decksRouter = Router();

const DECK_SIZE = 30;
const MAX_COPIES: Record<string, number> = {
  COMUN: 3,
  RARA: 3,
  EPICA: 2,
  LEGENDARIA: 1,
};

decksRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const decks = await prisma.deck.findMany({
    where: { ownerId: req.user!.userId },
    include: { cards: { include: { card: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(decks);
});

decksRouter.get("/:id", async (req, res) => {
  const deck = await prisma.deck.findUnique({
    where: { id: req.params.id },
    include: { cards: { include: { card: true } }, owner: { select: { username: true, displayName: true } } },
  });
  if (!deck) return res.status(404).json({ error: "Mazo no encontrado" });
  res.json(deck);
});

const deckCardSchema = z.object({ cardId: z.string(), quantity: z.number().int().min(1) });
const saveDeckSchema = z.object({
  name: z.string().min(1).max(40),
  isPublic: z.boolean().optional(),
  cards: z.array(deckCardSchema),
});

async function validateDeckCards(cards: { cardId: string; quantity: number }[]) {
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);
  if (total !== DECK_SIZE) {
    return `El mazo debe tener exactamente ${DECK_SIZE} cartas (tiene ${total})`;
  }
  const cardRecords = await prisma.card.findMany({ where: { id: { in: cards.map((c) => c.cardId) } } });
  const byId = new Map(cardRecords.map((c) => [c.id, c]));
  for (const entry of cards) {
    const card = byId.get(entry.cardId);
    if (!card) return `Carta ${entry.cardId} no existe`;
    const max = MAX_COPIES[card.rarity] ?? 3;
    if (entry.quantity > max) return `${card.name} permite máximo ${max} copias`;
  }
  return null;
}

decksRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = saveDeckSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const error = await validateDeckCards(parsed.data.cards);
  if (error) return res.status(400).json({ error });

  const deck = await prisma.deck.create({
    data: {
      name: parsed.data.name,
      ownerId: req.user!.userId,
      isPublic: parsed.data.isPublic ?? false,
      cards: { create: parsed.data.cards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })) },
    },
    include: { cards: { include: { card: true } } },
  });
  res.status(201).json(deck);
});

decksRouter.put("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = saveDeckSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const deck = await prisma.deck.findUnique({ where: { id: req.params.id } });
  if (!deck || deck.ownerId !== req.user!.userId) return res.status(404).json({ error: "Mazo no encontrado" });

  const error = await validateDeckCards(parsed.data.cards);
  if (error) return res.status(400).json({ error });

  await prisma.deckCard.deleteMany({ where: { deckId: deck.id } });
  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: {
      name: parsed.data.name,
      isPublic: parsed.data.isPublic ?? deck.isPublic,
      cards: { create: parsed.data.cards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })) },
    },
    include: { cards: { include: { card: true } } },
  });
  res.json(updated);
});

decksRouter.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const deck = await prisma.deck.findUnique({ where: { id: req.params.id } });
  if (!deck || deck.ownerId !== req.user!.userId) return res.status(404).json({ error: "Mazo no encontrado" });
  await prisma.deck.delete({ where: { id: deck.id } });
  res.status(204).end();
});

export { DECK_SIZE, MAX_COPIES };
