import { randomUUID } from "crypto";
import type { CardInstance, CardTemplate, GameAction, GameState, PlayerState } from "./types.js";

const STARTING_LIFE = 20;
const MAX_ENERGY = 10;
const MAX_BOARD_SIZE = 7;
const MAX_HAND_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toInstance(template: CardTemplate): CardInstance {
  return {
    instanceId: randomUUID(),
    cardId: template.id,
    name: template.name,
    cost: template.cost,
    type: template.type,
    attack: template.attack,
    health: template.health,
    currentHealth: template.health,
    effectKey: template.effectKey,
    hasAttacked: false,
    summoningSick: true,
    divineShield: false,
  };
}

function buildDeck(entries: { template: CardTemplate; quantity: number }[]): CardInstance[] {
  const list: CardInstance[] = [];
  for (const { template, quantity } of entries) {
    for (let i = 0; i < quantity; i++) list.push(toInstance(template));
  }
  return shuffle(list);
}

function createPlayer(userId: string, deckEntries: { template: CardTemplate; quantity: number }[], drawCount: number): PlayerState {
  const deck = buildDeck(deckEntries);
  const hand = deck.splice(0, drawCount);
  return {
    userId,
    life: STARTING_LIFE,
    energy: 0,
    maxEnergy: 0,
    deck,
    hand,
    board: [],
    graveyard: [],
    fatigue: 0,
  };
}

export function createGame(
  matchId: string,
  p1: { userId: string; deck: { template: CardTemplate; quantity: number }[] },
  p2: { userId: string; deck: { template: CardTemplate; quantity: number }[] }
): GameState {
  const first = Math.random() < 0.5 ? p1 : p2;
  const second = first === p1 ? p2 : p1;

  const players: Record<string, PlayerState> = {
    [first.userId]: createPlayer(first.userId, first.deck, 3),
    [second.userId]: createPlayer(second.userId, second.deck, 4),
  };

  const state: GameState = {
    matchId,
    players,
    turnPlayerId: first.userId,
    turnNumber: 1,
    phase: "IN_PROGRESS",
    winnerId: null,
    log: [`${first.userId} juega primero`],
  };

  startTurn(state, first.userId);
  return state;
}

function startTurn(state: GameState, playerId: string) {
  const player = state.players[playerId];
  player.maxEnergy = Math.min(MAX_ENERGY, player.maxEnergy + 1);
  player.energy = player.maxEnergy;
  for (const creature of player.board) {
    creature.summoningSick = false;
    creature.hasAttacked = false;
  }
  drawCard(state, playerId);
}

function drawCard(state: GameState, playerId: string) {
  const player = state.players[playerId];
  const card = player.deck.shift();
  if (!card) {
    player.fatigue += 1;
    player.life -= player.fatigue;
    state.log.push(`${playerId} sufre ${player.fatigue} de daño por fatiga`);
    checkGameOver(state);
    return;
  }
  if (player.hand.length >= MAX_HAND_SIZE) {
    player.graveyard.push(card);
    state.log.push(`${playerId} quema una carta por mano llena`);
    return;
  }
  player.hand.push(card);
}

function checkGameOver(state: GameState) {
  for (const player of Object.values(state.players)) {
    if (player.life <= 0) {
      state.phase = "FINISHED";
      const opponentId = Object.keys(state.players).find((id) => id !== player.userId)!;
      state.winnerId = opponentId;
      state.log.push(`${opponentId} gana la partida`);
    }
  }
}

function otherPlayerId(state: GameState, playerId: string): string {
  return Object.keys(state.players).find((id) => id !== playerId)!;
}

function applyDamageToCreature(state: GameState, ownerId: string, creature: CardInstance, amount: number) {
  if (creature.divineShield) {
    creature.divineShield = false;
    return;
  }
  creature.currentHealth = (creature.currentHealth ?? 0) - amount;
  if (creature.currentHealth <= 0) {
    const owner = state.players[ownerId];
    owner.board = owner.board.filter((c) => c.instanceId !== creature.instanceId);
    owner.graveyard.push(creature);
    state.log.push(`${creature.name} muere`);
  }
}

function resolveSpellEffect(state: GameState, casterId: string, effectKey: string, targetInstanceId?: string) {
  const opponentId = otherPlayerId(state, casterId);
  const caster = state.players[casterId];
  const opponent = state.players[opponentId];

  const findTarget = () => {
    for (const pid of [casterId, opponentId]) {
      const found = state.players[pid].board.find((c) => c.instanceId === targetInstanceId);
      if (found) return { owner: pid, creature: found };
    }
    return null;
  };

  switch (effectKey) {
    case "DAMAGE_2":
    case "DAMAGE_3":
    case "DAMAGE_4":
    case "DAMAGE_6": {
      const amount = Number(effectKey.split("_")[1]);
      if (targetInstanceId) {
        const t = findTarget();
        if (t) applyDamageToCreature(state, t.owner, t.creature, amount);
      } else {
        opponent.life -= amount;
      }
      break;
    }
    case "AOE_DAMAGE_2":
      for (const creature of [...opponent.board]) applyDamageToCreature(state, opponentId, creature, 2);
      break;
    case "HEAL_4":
      caster.life = Math.min(STARTING_LIFE + 10, caster.life + 4);
      break;
    case "HEAL_8":
      caster.life = Math.min(STARTING_LIFE + 10, caster.life + 8);
      break;
    case "DRAW_2":
      drawCard(state, casterId);
      drawCard(state, casterId);
      break;
    case "BUFF_ATTACK_2": {
      const t = findTarget();
      if (t && t.owner === casterId) {
        t.creature.attack = (t.creature.attack ?? 0) + 2;
      }
      break;
    }
    case "DESTROY_TARGET": {
      const t = findTarget();
      if (t) applyDamageToCreature(state, t.owner, t.creature, 999);
      break;
    }
    default:
      break;
  }
  checkGameOver(state);
}

export function applyAction(state: GameState, playerId: string, action: GameAction): { ok: true } | { ok: false; error: string } {
  if (state.phase === "FINISHED") return { ok: false, error: "La partida ya terminó" };
  if (state.turnPlayerId !== playerId) return { ok: false, error: "No es tu turno" };

  const player = state.players[playerId];
  const opponentId = otherPlayerId(state, playerId);
  const opponent = state.players[opponentId];

  if (action.type === "PLAY_CARD") {
    const idx = player.hand.findIndex((c) => c.instanceId === action.instanceId);
    if (idx === -1) return { ok: false, error: "Carta no está en tu mano" };
    const card = player.hand[idx];
    if (card.cost > player.energy) return { ok: false, error: "Energía insuficiente" };

    if (card.type === "CREATURE") {
      if (player.board.length >= MAX_BOARD_SIZE) return { ok: false, error: "Tablero lleno" };
      player.hand.splice(idx, 1);
      player.energy -= card.cost;
      card.summoningSick = card.effectKey !== "CHARGE";
      player.board.push(card);
      state.log.push(`${playerId} juega ${card.name}`);
    } else {
      player.hand.splice(idx, 1);
      player.energy -= card.cost;
      player.graveyard.push(card);
      state.log.push(`${playerId} lanza ${card.name}`);
      if (card.effectKey) resolveSpellEffect(state, playerId, card.effectKey, action.targetInstanceId);
    }
    checkGameOver(state);
    return { ok: true };
  }

  if (action.type === "ATTACK") {
    const attacker = player.board.find((c) => c.instanceId === action.attackerInstanceId);
    if (!attacker) return { ok: false, error: "Criatura atacante inválida" };
    if (attacker.summoningSick) return { ok: false, error: "La criatura no puede atacar todavía" };
    if (attacker.hasAttacked) return { ok: false, error: "Esa criatura ya atacó este turno" };

    const taunts = opponent.board.filter((c) => c.effectKey === "TAUNT");

    if (action.targetInstanceId === "FACE") {
      if (taunts.length > 0) return { ok: false, error: "Debés atacar una criatura con Provocar primero" };
      opponent.life -= attacker.attack ?? 0;
      attacker.hasAttacked = true;
      state.log.push(`${attacker.name} ataca directo por ${attacker.attack}`);
    } else {
      const target = opponent.board.find((c) => c.instanceId === action.targetInstanceId);
      if (!target) return { ok: false, error: "Objetivo inválido" };
      if (taunts.length > 0 && target.effectKey !== "TAUNT") {
        return { ok: false, error: "Debés atacar una criatura con Provocar primero" };
      }
      applyDamageToCreature(state, opponentId, target, attacker.attack ?? 0);
      if (attacker.effectKey === "LIFESTEAL") {
        player.life = Math.min(STARTING_LIFE + 10, player.life + (attacker.attack ?? 0));
      }
      applyDamageToCreature(state, playerId, attacker, target.attack ?? 0);
      attacker.hasAttacked = true;
      state.log.push(`${attacker.name} combate contra ${target.name}`);
    }
    checkGameOver(state);
    return { ok: true };
  }

  if (action.type === "END_TURN") {
    state.turnPlayerId = opponentId;
    state.turnNumber += 1;
    startTurn(state, opponentId);
    return { ok: true };
  }

  return { ok: false, error: "Acción desconocida" };
}

export function serializeStateFor(state: GameState, viewerId: string) {
  const opponentId = otherPlayerId(state, viewerId);
  return {
    matchId: state.matchId,
    turnPlayerId: state.turnPlayerId,
    turnNumber: state.turnNumber,
    phase: state.phase,
    winnerId: state.winnerId,
    log: state.log.slice(-20),
    me: state.players[viewerId],
    opponent: {
      ...state.players[opponentId],
      hand: state.players[opponentId].hand.map(() => null),
      deck: [],
    },
  };
}
