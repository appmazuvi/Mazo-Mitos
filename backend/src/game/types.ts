export type CardType = "CREATURE" | "SPELL";

export interface CardTemplate {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  attack: number | null;
  health: number | null;
  effectKey: string | null;
  description: string;
  imageUrl: string | null;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  name: string;
  cost: number;
  type: CardType;
  attack: number | null;
  health: number | null;
  currentHealth: number | null;
  effectKey: string | null;
  imageUrl: string | null;
  hasAttacked: boolean;
  summoningSick: boolean;
  divineShield: boolean;
}

export interface PlayerState {
  userId: string;
  life: number;
  energy: number;
  maxEnergy: number;
  deck: CardInstance[];
  hand: CardInstance[];
  board: CardInstance[];
  graveyard: CardInstance[];
  fatigue: number;
}

export type MatchPhase = "IN_PROGRESS" | "FINISHED";

export interface GameState {
  matchId: string;
  players: Record<string, PlayerState>;
  turnPlayerId: string;
  turnNumber: number;
  phase: MatchPhase;
  winnerId: string | null;
  log: string[];
}

export type GameAction =
  | { type: "PLAY_CARD"; instanceId: string; targetInstanceId?: string }
  | { type: "ATTACK"; attackerInstanceId: string; targetInstanceId: string | "FACE" }
  | { type: "END_TURN" };
