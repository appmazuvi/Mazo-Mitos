export interface User {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role?: "USER" | "ADMIN";
}

export interface Conversation {
  id: string;
  otherUser: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
  lastMessage: Message | null;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface AdminMetrics {
  userCount: number;
  matchCount: number;
  postCount: number;
  cardCount: number;
  deckCount: number;
  matchesToday: number;
  topCards: { card: Card | null; count: number }[];
  usersLast7Days: { day: string; count: number }[];
}

export interface AdminUser {
  id: string;
  username: string;
  displayName?: string | null;
  email: string;
  role: "USER" | "ADMIN";
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
  _count: { posts: number; decks: number; matchesAsP1: number; matchesAsP2: number };
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
  featured?: boolean;
  cards: DeckCard[];
  owner?: { username: string; displayName?: string | null };
}

export type ReactionType = "LIKE" | "LOVE" | "FIRE" | "LAUGH" | "WOW";

export interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  images?: string[];
  createdAt: string;
  author: { username: string; displayName?: string | null; avatarUrl?: string | null };
  group?: { slug: string; name: string; avatarUrl?: string | null } | null;
  _count: { comments: number; likes: number };
  likedByMe?: boolean;
  myReaction?: ReactionType | null;
  reactionCounts?: Partial<Record<ReactionType, number>>;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  author: { username: string; displayName?: string | null; avatarUrl?: string | null };
}

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserAchievement {
  unlockedAt: string;
  achievement: Achievement;
}

export interface ProfileData {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  role?: string;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  rank: number;
  isFollowing: boolean;
  achievements: UserAchievement[];
  decks: Deck[];
  _count: { followers: number; following: number; posts: number };
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  owner: { username: string; displayName?: string | null; avatarUrl?: string | null };
  isMember?: boolean;
  _count: { members: number; posts: number };
}

export interface Story {
  id: string;
  imageUrl: string;
  caption?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  authorId: string;
  author: { username: string; displayName?: string | null; avatarUrl?: string | null };
  stories: Story[];
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
  imageUrl?: string | null;
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
