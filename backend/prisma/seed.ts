import { PrismaClient, CardType, Rarity } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateCardArt, FACTION_CARD_NAMES } from "./cardArt.js";

const MAX_COPIES: Record<string, number> = { COMUN: 3, RARA: 3, EPICA: 2, LEGENDARIA: 1 };
const DECK_SIZE = 30;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PERSONAS: { username: string; displayName: string; faction: string; bio: string }[] = [
  { username: "brasa_certera", displayName: "Kaelith Brasa", faction: "ignis", bio: "Sacerdotisa de Ignis. El fuego no perdona, y yo tampoco." },
  { username: "marea_eterna", displayName: "Nerith Marea", faction: "abisal", bio: "Guardiana de las corrientes abisales. Paciencia infinita, golpe certero." },
  { username: "raiz_ancestral", displayName: "Doran Raíz", faction: "terra", bio: "Hijo de la piedra y la raíz. Construyo mazos que no se rompen." },
  { username: "viento_libre", displayName: "Skye Viento", faction: "cefiro", bio: "Vuelo antes de que me vean llegar. Velocidad ante todo." },
  { username: "sombra_arcana", displayName: "Malzar Sombra", faction: "void", bio: "Estudioso del Vacío. Todo conocimiento tiene un precio." },
];

const DECK_ADJECTIVES = ["de Batalla", "Definitivo", "del Campeón", "Curado", "Competitivo"];

const prisma = new PrismaClient();

interface CardSeed {
  name: string;
  cost: number;
  type: CardType;
  attack?: number;
  health?: number;
  rarity: Rarity;
  effectKey?: string;
  description: string;
}

// Ambientación: El Multiverso de Aralon, cinco facciones elementales en guerra eterna.
const cards: CardSeed[] = [
  // --- Ignis (Fuego) ---
  { name: "Chispa Errante", cost: 1, type: "CREATURE", attack: 2, health: 1, rarity: "COMUN", description: "Un espíritu de fuego joven e impredecible." },
  { name: "Recluta de Ignis", cost: 2, type: "CREATURE", attack: 2, health: 3, rarity: "COMUN", description: "Soldado curtido en las forjas del volcán." },
  { name: "Salamandra Feroz", cost: 3, type: "CREATURE", attack: 4, health: 2, rarity: "COMUN", effectKey: "CHARGE", description: "Carga (puede atacar el turno que entra)." },
  { name: "Bola de Fuego", cost: 2, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_3", description: "Inflige 3 de daño a un objetivo o al rival." },
  { name: "Centinela de Brasas", cost: 3, type: "CREATURE", attack: 2, health: 5, rarity: "RARA", effectKey: "TAUNT", description: "Provocar: los enemigos deben atacarlo primero." },
  { name: "Furia Volcánica", cost: 5, type: "SPELL", rarity: "RARA", effectKey: "AOE_DAMAGE_2", description: "Inflige 2 de daño a todas las criaturas enemigas." },
  { name: "Señor de las Llamas", cost: 6, type: "CREATURE", attack: 6, health: 5, rarity: "EPICA", effectKey: "CHARGE", description: "Carga. Un noble caído consumido por su propia ira." },
  { name: "Ignareth, el Eterno", cost: 8, type: "CREATURE", attack: 8, health: 8, rarity: "LEGENDARIA", effectKey: "CHARGE", description: "El dragón primordial que forjó el elemento del fuego." },

  // --- Abisal (Agua) ---
  { name: "Pez Espada Menor", cost: 1, type: "CREATURE", attack: 1, health: 2, rarity: "COMUN", description: "Rápido y escurridizo." },
  { name: "Sacerdotisa Abisal", cost: 2, type: "CREATURE", attack: 1, health: 3, rarity: "COMUN", description: "Sirve a las corrientes profundas." },
  { name: "Marea Curativa", cost: 2, type: "SPELL", rarity: "COMUN", effectKey: "HEAL_4", description: "Restaura 4 puntos de vida." },
  { name: "Kraken Juvenil", cost: 4, type: "CREATURE", attack: 4, health: 5, rarity: "RARA", description: "Todavía está aprendiendo el tamaño de sus tentáculos." },
  { name: "Guardiana de Marea", cost: 4, type: "CREATURE", attack: 3, health: 6, rarity: "RARA", effectKey: "TAUNT", description: "Provocar." },
  { name: "Bendición del Océano", cost: 5, type: "SPELL", rarity: "RARA", effectKey: "HEAL_8", description: "Restaura 8 puntos de vida." },
  { name: "Leviatán de las Profundidades", cost: 7, type: "CREATURE", attack: 7, health: 7, rarity: "EPICA", effectKey: "LIFESTEAL", description: "Vampirismo: cura a su dueño por el daño que inflige." },
  { name: "Nayadel, Señora del Abismo", cost: 8, type: "CREATURE", attack: 6, health: 9, rarity: "LEGENDARIA", effectKey: "TAUNT", description: "Provocar. La reina ahogada que nunca duerme." },

  // --- Terra (Tierra) ---
  { name: "Brote Espinoso", cost: 1, type: "CREATURE", attack: 1, health: 3, rarity: "COMUN", description: "Crece rápido, pica más rápido." },
  { name: "Golem de Barro", cost: 2, type: "CREATURE", attack: 1, health: 4, rarity: "COMUN", effectKey: "TAUNT", description: "Provocar." },
  { name: "Muro de Raíces", cost: 3, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Oso Ancestral", cost: 4, type: "CREATURE", attack: 4, health: 6, rarity: "RARA", description: "Guardián de los bosques antiguos." },
  { name: "Coloso de Piedra", cost: 5, type: "CREATURE", attack: 4, health: 8, rarity: "RARA", effectKey: "TAUNT", description: "Provocar." },
  { name: "Grito de la Montaña", cost: 4, type: "SPELL", rarity: "RARA", effectKey: "BUFF_ATTACK_2", description: "Una criatura propia gana +2 de ataque permanente." },
  { name: "Titán Sismico", cost: 7, type: "CREATURE", attack: 7, health: 9, rarity: "EPICA", effectKey: "TAUNT", description: "Provocar. Cada paso suyo es un terremoto." },
  { name: "Gaiathor, Corazón del Mundo", cost: 9, type: "CREATURE", attack: 7, health: 10, rarity: "LEGENDARIA", effectKey: "TAUNT", description: "Provocar. El primer ser nacido de la piedra." },

  // --- Céfiro (Aire) ---
  { name: "Halcón Veloz", cost: 1, type: "CREATURE", attack: 2, health: 1, rarity: "COMUN", effectKey: "CHARGE", description: "Carga." },
  { name: "Explorador del Viento", cost: 2, type: "CREATURE", attack: 3, health: 2, rarity: "COMUN", description: "Nunca se queda quieto." },
  { name: "Ráfaga Cortante", cost: 1, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Arquera de las Nubes", cost: 3, type: "CREATURE", attack: 3, health: 3, rarity: "RARA", description: "Dispara antes de que la vean." },
  { name: "Robo de Sabiduría", cost: 3, type: "SPELL", rarity: "RARA", effectKey: "DRAW_2", description: "Robá 2 cartas." },
  { name: "Grifo Tormentoso", cost: 5, type: "CREATURE", attack: 5, health: 4, rarity: "RARA", effectKey: "CHARGE", description: "Carga." },
  { name: "Fénix de Céfiro", cost: 6, type: "CREATURE", attack: 5, health: 5, rarity: "EPICA", effectKey: "LIFESTEAL", description: "Vampirismo." },
  { name: "Aerin, la Tempestad Viva", cost: 7, type: "CREATURE", attack: 6, health: 6, rarity: "LEGENDARIA", effectKey: "CHARGE", description: "Carga. Nació en el ojo de la tormenta eterna." },

  // --- Void (Arcano) ---
  { name: "Susurro del Vacío", cost: 1, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Aprendiz Arcano", cost: 2, type: "CREATURE", attack: 2, health: 2, rarity: "COMUN", description: "Estudia lo que no debería estudiarse." },
  { name: "Escudo Etéreo", cost: 2, type: "CREATURE", attack: 1, health: 1, rarity: "RARA", effectKey: "TAUNT", description: "Provocar. Frágil pero protegido por un velo mágico." },
  { name: "Golpe del Vacío", cost: 4, type: "SPELL", rarity: "RARA", effectKey: "DAMAGE_4", description: "Inflige 4 de daño a un objetivo o al rival." },
  { name: "Devorador de Almas", cost: 5, type: "CREATURE", attack: 5, health: 5, rarity: "RARA", effectKey: "LIFESTEAL", description: "Vampirismo." },
  { name: "Aniquilación", cost: 6, type: "SPELL", rarity: "EPICA", effectKey: "DESTROY_TARGET", description: "Destruye una criatura, sin importar su tamaño." },
  { name: "Tormenta de Meteoros", cost: 8, type: "SPELL", rarity: "EPICA", effectKey: "DAMAGE_6", description: "Inflige 6 de daño a un objetivo o al rival." },
  { name: "Nyxandra, Devoradora de Mundos", cost: 9, type: "CREATURE", attack: 9, health: 9, rarity: "LEGENDARIA", effectKey: "LIFESTEAL", description: "Vampirismo. Lo que toca deja de existir." },

  // --- Ignis (Fuego) II ---
  { name: "Trol de Forja", cost: 3, type: "CREATURE", attack: 4, health: 2, rarity: "COMUN", description: "Vive entre las llamas de la fragua." },
  { name: "Heraldo Ardiente", cost: 4, type: "CREATURE", attack: 3, health: 4, rarity: "RARA", effectKey: "TAUNT", description: "Provocar. Anuncia la llegada del fuego." },
  { name: "Explosión Menor", cost: 1, type: "SPELL", rarity: "RARA", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Behemot de Cenizas", cost: 6, type: "CREATURE", attack: 6, health: 6, rarity: "EPICA", effectKey: "LIFESTEAL", description: "Vampirismo. Se alimenta de la destrucción." },
  { name: "Vulkar, el Incendiario", cost: 8, type: "CREATURE", attack: 7, health: 7, rarity: "LEGENDARIA", effectKey: "CHARGE", description: "Carga. Su paso deja tierra quemada." },

  // --- Abisal (Agua) II ---
  { name: "Anguila Eléctrica", cost: 2, type: "CREATURE", attack: 2, health: 2, rarity: "COMUN", effectKey: "CHARGE", description: "Carga." },
  { name: "Chamán de Coral", cost: 3, type: "CREATURE", attack: 2, health: 4, rarity: "COMUN", description: "Habla con los espíritus del arrecife." },
  { name: "Corriente Curativa", cost: 3, type: "SPELL", rarity: "RARA", effectKey: "HEAL_4", description: "Restaura 4 puntos de vida." },
  { name: "Guardián Abisal", cost: 5, type: "CREATURE", attack: 4, health: 7, rarity: "RARA", effectKey: "TAUNT", description: "Provocar." },
  { name: "Thalassa, Madre de las Mareas", cost: 7, type: "CREATURE", attack: 6, health: 8, rarity: "LEGENDARIA", effectKey: "TAUNT", description: "Provocar. Ancestro de todas las aguas." },

  // --- Terra (Tierra) II ---
  { name: "Erizo de Piedra", cost: 1, type: "CREATURE", attack: 1, health: 2, rarity: "COMUN", effectKey: "TAUNT", description: "Provocar." },
  { name: "Cazador del Bosque", cost: 3, type: "CREATURE", attack: 3, health: 3, rarity: "COMUN", description: "Conoce cada sendero oculto." },
  { name: "Enredadera Voraz", cost: 2, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Ancestro de Roble", cost: 5, type: "CREATURE", attack: 5, health: 5, rarity: "RARA", effectKey: "LIFESTEAL", description: "Vampirismo. Sus raíces drenan la vida cercana." },
  { name: "Yggros, el Inquebrantable", cost: 9, type: "CREATURE", attack: 8, health: 11, rarity: "LEGENDARIA", effectKey: "TAUNT", description: "Provocar. La montaña que camina." },

  // --- Céfiro (Aire) II ---
  { name: "Colibrí Veloz", cost: 1, type: "CREATURE", attack: 1, health: 1, rarity: "COMUN", effectKey: "CHARGE", description: "Carga." },
  { name: "Vigía de las Alturas", cost: 2, type: "CREATURE", attack: 2, health: 3, rarity: "COMUN", description: "Vigila desde las nubes más altas." },
  { name: "Corte de Viento", cost: 3, type: "SPELL", rarity: "RARA", effectKey: "DAMAGE_3", description: "Inflige 3 de daño a un objetivo o al rival." },
  { name: "Águila Tormentosa", cost: 5, type: "CREATURE", attack: 5, health: 3, rarity: "RARA", effectKey: "CHARGE", description: "Carga." },
  { name: "Zephyra, Alma del Cielo", cost: 7, type: "CREATURE", attack: 6, health: 6, rarity: "EPICA", effectKey: "CHARGE", description: "Carga. Nadie ha visto sus alas y vivido para contarlo." },

  // --- Void (Arcano) II ---
  { name: "Chispa Prohibida", cost: 1, type: "SPELL", rarity: "COMUN", effectKey: "DAMAGE_2", description: "Inflige 2 de daño a un objetivo." },
  { name: "Vidente del Abismo", cost: 2, type: "CREATURE", attack: 1, health: 3, rarity: "COMUN", description: "Ve lo que otros temen mirar." },
  { name: "Ritual de Sangre", cost: 4, type: "SPELL", rarity: "EPICA", effectKey: "DRAW_2", description: "Robá 2 cartas." },
  { name: "Vorágine Final", cost: 9, type: "SPELL", rarity: "LEGENDARIA", effectKey: "DAMAGE_6", description: "Inflige 6 de daño a un objetivo o al rival. El vacío no perdona." },
  { name: "Aprendiz de Sombra", cost: 2, type: "CREATURE", attack: 2, health: 3, rarity: "COMUN", description: "Camina entre la luz y la oscuridad." },
];

async function main() {
  for (const card of cards) {
    const imageUrl = generateCardArt(card.name, card.rarity);
    await prisma.card.upsert({
      where: { name: card.name },
      update: { ...card, imageUrl },
      create: { ...card, imageUrl },
    });
  }
  console.log(`Sembradas ${cards.length} cartas con arte generado.`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cartaverso.dev";
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "cartaverso_admin_2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      displayName: "Administrador",
      role: "ADMIN",
    },
  });
  console.log(`Usuario admin listo: ${adminUsername} / ${adminEmail}`);

  const allCards = await prisma.card.findMany();
  const byName = new Map(allCards.map((c) => [c.name, c]));

  let decksCreated = 0;
  for (const persona of PERSONAS) {
    const passwordHash2 = await bcrypt.hash("cartaverso_persona_2026", 10);
    const user = await prisma.user.upsert({
      where: { username: persona.username },
      update: { displayName: persona.displayName, bio: persona.bio },
      create: {
        email: `${persona.username}@cartaverso.dev`,
        username: persona.username,
        passwordHash: passwordHash2,
        displayName: persona.displayName,
        bio: persona.bio,
      },
    });

    const factionCards = (FACTION_CARD_NAMES[persona.faction] ?? []).map((n) => byName.get(n)).filter((c): c is (typeof allCards)[number] => !!c);
    const pool = shuffle(factionCards.flatMap((c) => Array.from({ length: MAX_COPIES[c.rarity] ?? 3 }, () => c)));

    for (let i = 0; i < 3; i++) {
      const shuffled = shuffle(pool);
      const quantities = new Map<string, number>();
      let total = 0;
      for (const card of shuffled) {
        if (total >= DECK_SIZE) break;
        const current = quantities.get(card.id) ?? 0;
        if (current >= (MAX_COPIES[card.rarity] ?? 3)) continue;
        quantities.set(card.id, current + 1);
        total += 1;
      }
      if (total < DECK_SIZE) continue;

      const deckName = `${persona.displayName.split(" ")[0]} ${DECK_ADJECTIVES[i % DECK_ADJECTIVES.length]}`;
      const existing = await prisma.deck.findFirst({ where: { ownerId: user.id, name: deckName } });
      if (existing) continue;

      await prisma.deck.create({
        data: {
          name: deckName,
          ownerId: user.id,
          isPublic: true,
          featured: i === 0,
          cards: { create: [...quantities.entries()].map(([cardId, quantity]) => ({ cardId, quantity })) },
        },
      });
      decksCreated += 1;
    }

    const existingPost = await prisma.post.findFirst({ where: { authorId: user.id } });
    if (!existingPost) {
      await prisma.post.create({
        data: {
          authorId: user.id,
          content: `¡Recién armé mi mazo de ${persona.faction === "ignis" ? "Ignis" : persona.faction === "abisal" ? "Abisal" : persona.faction === "terra" ? "Terra" : persona.faction === "cefiro" ? "Céfiro" : "Vacío"}! ¿Alguien se anima a una partida? 🔥`,
        },
      });
    }
  }
  console.log(`Sembrados ${PERSONAS.length} jugadores y ${decksCreated} mazos públicos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
