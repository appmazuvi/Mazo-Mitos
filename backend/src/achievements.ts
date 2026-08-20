import { prisma } from "./prisma.js";
import { pushToUser } from "./realtime.js";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  check: (userId: string) => Promise<boolean>;
}

async function winCount(userId: string) {
  return prisma.match.count({ where: { winnerId: userId } });
}
async function followerCount(userId: string) {
  return prisma.follow.count({ where: { followingId: userId } });
}
async function followingCount(userId: string) {
  return prisma.follow.count({ where: { followerId: userId } });
}
async function deckCount(userId: string) {
  return prisma.deck.count({ where: { ownerId: userId } });
}
async function postCount(userId: string) {
  return prisma.post.count({ where: { authorId: userId } });
}
async function groupCount(userId: string) {
  return prisma.group.count({ where: { ownerId: userId } });
}
async function rating(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { peakRating: true } });
  return u?.peakRating ?? 1000;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "FIRST_WIN", name: "Primera Victoria", description: "Ganá tu primera partida.", icon: "trophy", check: async (u) => (await winCount(u)) >= 1 },
  { key: "WIN_10", name: "Veterano", description: "Ganá 10 partidas.", icon: "swords", check: async (u) => (await winCount(u)) >= 10 },
  { key: "WIN_50", name: "Leyenda del Multiverso", description: "Ganá 50 partidas.", icon: "crown", check: async (u) => (await winCount(u)) >= 50 },
  { key: "FIRST_POST", name: "Voz del Multiverso", description: "Publicá tu primer post.", icon: "message", check: async (u) => (await postCount(u)) >= 1 },
  { key: "FIRST_FOLLOWER", name: "Con Seguidores", description: "Conseguí tu primer seguidor.", icon: "users", check: async (u) => (await followerCount(u)) >= 1 },
  { key: "FOLLOWERS_25", name: "Influencer Arcano", description: "Alcanzá 25 seguidores.", icon: "star", check: async (u) => (await followerCount(u)) >= 25 },
  { key: "SOCIAL_BUTTERFLY", name: "Mariposa Social", description: "Seguí a 10 jugadores.", icon: "users", check: async (u) => (await followingCount(u)) >= 10 },
  { key: "FIRST_DECK", name: "Constructor", description: "Creá tu primer mazo.", icon: "deck", check: async (u) => (await deckCount(u)) >= 1 },
  { key: "DECK_MASTER", name: "Maestro de Mazos", description: "Creá 5 mazos.", icon: "deck", check: async (u) => (await deckCount(u)) >= 5 },
  { key: "RATING_1200", name: "En Ascenso", description: "Alcanzá 1200 de rating.", icon: "gauge", check: async (u) => (await rating(u)) >= 1200 },
  { key: "RATING_1500", name: "Elite", description: "Alcanzá 1500 de rating.", icon: "crown", check: async (u) => (await rating(u)) >= 1500 },
  { key: "FIRST_GROUP", name: "Fundador", description: "Creá un grupo.", icon: "shield", check: async (u) => (await groupCount(u)) >= 1 },
];

export async function ensureAchievementsSeeded() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon },
      create: { key: a.key, name: a.name, description: a.description, icon: a.icon },
    });
  }
}

export async function evaluateAchievements(userId: string) {
  const unlocked = await prisma.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { key: true } } } });
  const unlockedKeys = new Set(unlocked.map((u) => u.achievement.key));
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    if (unlockedKeys.has(def.key)) continue;
    if (await def.check(userId)) newlyUnlocked.push(def);
  }

  for (const def of newlyUnlocked) {
    const achievement = await prisma.achievement.findUnique({ where: { key: def.key } });
    if (!achievement) continue;
    await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
    const message = `Desbloqueaste el logro "${def.name}"`;
    await prisma.notification.create({ data: { targetId: userId, type: "ACHIEVEMENT", message } });
    pushToUser(userId, "notification:new", { type: "ACHIEVEMENT", message });
  }

  return newlyUnlocked;
}
