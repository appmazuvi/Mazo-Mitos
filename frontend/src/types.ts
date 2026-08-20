export interface User {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: "CREATURE" | "SPELL";
  attack: number | null;
  health: number | null;
  rarity: "COMUN" | "RARA" | "EPICA" | "LEGENDARIA";
  effectKey: string | null;
  description: string;
  imageUrl?: string | null;
}

export interface DeckCard {
  id: string;
  cardId: string;
  quantity: number;
  card: Card;
}

export interface Deck {
  id: string;
  name: string;
  isPublic: boolean;
  cards: DeckCard[];
  owner?: { username: string; displayName?: string | null };
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  author: { username: string; displayName?: string | null; avatarUrl?: string | null };
  _count: { comments: number; likes: number };
  likedByMe?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; displayName?: string | null; avatarUrl?: string | null };
}

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  name: string;
  cost: number;
  type: "CREATURE" | "SPELL";
  attack: number | null;
  health: number | null;
  currentHealth: number | null;
  effectKey: string | null;
  hasAttacked: boolean;
  summoningSick: boolean;
  divineShield: boolean;
}

export interface PlayerStateView {
  userId: string;
  life: number;
  energy: number;
  maxEnergy: number;
  hand: (CardInstance | null)[];
  board: CardInstance[];
  graveyard: CardInstance[];
  deck: CardInstance[];
  fatigue: number;
}

export interface GameStateView {
  matchId: string;
  turnPlayerId: string;
  turnNumber: number;
  phase: "IN_PROGRESS" | "FINISHED";
  winnerId: string | null;
  log: string[];
  me: PlayerStateView;
  opponent: PlayerStateView;
}
