import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { applyAction, createGame, serializeStateFor } from "./engine.js";
import { pushToUser } from "../realtime.js";
import { evaluateAchievements } from "../achievements.js";
import type { CardTemplate, GameAction, GameState } from "./types.js";

const K_FACTOR = 32;

function eloDelta(ratingA: number, ratingB: number, scoreA: 0 | 1) {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  return Math.round(K_FACTOR * (scoreA - expectedA));
}

interface QueueEntry {
  socket: Socket;
  userId: string;
  username: string;
  deckId: string;
}

interface ActiveMatch {
  state: GameState;
  sockets: Record<string, Socket>;
}

const queue: QueueEntry[] = [];
const activeMatches = new Map<string, ActiveMatch>();
const socketToMatch = new Map<string, string>();

async function loadDeckEntries(deckId: string, userId: string) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { cards: { include: { card: true } } },
  });
  if (!deck || deck.ownerId !== userId) return null;
  return deck.cards.map((dc) => ({
    template: {
      id: dc.card.id,
      name: dc.card.name,
      cost: dc.card.cost,
      type: dc.card.type,
      attack: dc.card.attack,
      health: dc.card.health,
      effectKey: dc.card.effectKey,
      imageUrl: dc.card.imageUrl,
      description: dc.card.description,
    } as CardTemplate,
    quantity: dc.quantity,
  }));
}

function broadcastState(match: ActiveMatch) {
  for (const [userId, socket] of Object.entries(match.sockets)) {
    socket.emit("game:state", serializeStateFor(match.state, userId));
  }
}

async function finishMatch(matchId: string, match: ActiveMatch) {
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "FINISHED", winnerId: match.state.winnerId, finishedAt: new Date() },
  });

  const userIds = Object.keys(match.sockets);
  const [userA, userB] = await Promise.all(userIds.map((id) => prisma.user.findUnique({ where: { id }, select: { id: true, rating: true, peakRating: true } })));

  if (userA && userB) {
    const aWon = userA.id === match.state.winnerId ? 1 : 0;
    const deltaA = eloDelta(userA.rating, userB.rating, aWon as 0 | 1);
    const deltaB = eloDelta(userB.rating, userA.rating, (1 - aWon) as 0 | 1);
    const newA = Math.max(0, userA.rating + deltaA);
    const newB = Math.max(0, userB.rating + deltaB);
    await prisma.user.update({ where: { id: userA.id }, data: { rating: newA, peakRating: Math.max(userA.peakRating, newA) } });
    await prisma.user.update({ where: { id: userB.id }, data: { rating: newB, peakRating: Math.max(userB.peakRating, newB) } });
  }

  for (const userId of userIds) {
    const message = userId === match.state.winnerId ? "¡Ganaste tu partida!" : "Perdiste tu partida.";
    await prisma.notification.create({ data: { targetId: userId, type: "MATCH_RESULT", message } });
    pushToUser(userId, "notification:new", { type: "MATCH_RESULT", message });
    evaluateAchievements(userId).catch(() => {});
  }
  activeMatches.delete(matchId);
  for (const socket of Object.values(match.sockets)) socketToMatch.delete(socket.id);
}

async function tryMatchmake(io: Server) {
  while (queue.length >= 2) {
    const a = queue.shift()!;
    const b = queue.shift()!;

    const [deckA, deckB] = await Promise.all([loadDeckEntries(a.deckId, a.userId), loadDeckEntries(b.deckId, b.userId)]);
    if (!deckA || !deckB) {
      if (!deckA) a.socket.emit("queue:error", { error: "Mazo inválido" });
      else queue.unshift(a);
      if (!deckB) b.socket.emit("queue:error", { error: "Mazo inválido" });
      else queue.unshift(b);
      continue;
    }

    const dbMatch = await prisma.match.create({
      data: { player1Id: a.userId, player2Id: b.userId, status: "IN_PROGRESS" },
    });

    const state = createGame(dbMatch.id, { userId: a.userId, deck: deckA }, { userId: b.userId, deck: deckB });
    const activeMatch: ActiveMatch = { state, sockets: { [a.userId]: a.socket, [b.userId]: b.socket } };
    activeMatches.set(dbMatch.id, activeMatch);
    socketToMatch.set(a.socket.id, dbMatch.id);
    socketToMatch.set(b.socket.id, dbMatch.id);

    broadcastState(activeMatch);
  }
}

export function registerGameSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("queue:join", async ({ deckId }: { deckId: string }) => {
      if (queue.some((q) => q.userId === socket.data.userId)) return;
      queue.push({ socket, userId: socket.data.userId, username: socket.data.username, deckId });
      socket.emit("queue:joined");
      await tryMatchmake(io);
    });

    socket.on("queue:leave", () => {
      const idx = queue.findIndex((q) => q.socket.id === socket.id);
      if (idx !== -1) queue.splice(idx, 1);
    });

    socket.on("game:action", async ({ matchId, action }: { matchId: string; action: GameAction }) => {
      const match = activeMatches.get(matchId);
      if (!match) return socket.emit("game:error", { error: "Partida no encontrada" });

      const result = applyAction(match.state, socket.data.userId, action);
      if (!result.ok) return socket.emit("game:error", { error: result.error });

      broadcastState(match);
      if (match.state.phase === "FINISHED") await finishMatch(matchId, match);
    });

    socket.on("disconnect", async () => {
      const qIdx = queue.findIndex((q) => q.socket.id === socket.id);
      if (qIdx !== -1) queue.splice(qIdx, 1);

      const matchId = socketToMatch.get(socket.id);
      if (!matchId) return;
      const match = activeMatches.get(matchId);
      if (!match || match.state.phase === "FINISHED") return;

      const remainingUserId = Object.keys(match.sockets).find((id) => match.sockets[id].id !== socket.id);
      match.state.phase = "FINISHED";
      match.state.winnerId = remainingUserId ?? null;
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "ABANDONED", winnerId: match.state.winnerId, finishedAt: new Date() },
      });
      if (remainingUserId) match.sockets[remainingUserId].emit("game:state", serializeStateFor(match.state, remainingUserId));
      activeMatches.delete(matchId);
    });
  });
}
