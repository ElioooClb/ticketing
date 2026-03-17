import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedReferentiels(): Promise<void> {
  const statuts = ["En attente", "En cours", "Résolu", "Clos"];
  const priorites = ["Basse", "Moyenne", "Haute", "Critique"];

  for (const libelle of statuts) {
    await prisma.statut.upsert({
      where: { libelle },
      update: {},
      create: { libelle },
    });
  }

  for (const libelle of priorites) {
    await prisma.priorite.upsert({
      where: { libelle },
      update: {},
      create: { libelle },
    });
  }

  // Migration métier: suppression de "Nouveau".
  // Si des tickets historiques pointent dessus, on les bascule vers "En attente".
  const enAttente = await prisma.statut.findUnique({
    where: { libelle: "En attente" },
    select: { idStatut: true },
  });
  const nouveau = await prisma.statut.findUnique({
    where: { libelle: "Nouveau" },
    select: { idStatut: true },
  });

  if (enAttente && nouveau) {
    await prisma.ticket.updateMany({
      where: { idStatut: nouveau.idStatut },
      data: { idStatut: enAttente.idStatut },
    });

    await prisma.statut.delete({
      where: { idStatut: nouveau.idStatut },
    });
  }
}

async function seedUsers(): Promise<void> {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await prisma.utilisateur.upsert({
    where: { email: "admin@ticketing.local" },
    update: {
      nom: "Admin",
      prenom: "Eliot",
      role: "admin",
      motDePasse: adminPassword,
    },
    create: {
      nom: "Admin",
      prenom: "Eliot",
      email: "admin@ticketing.local",
      role: "admin",
      motDePasse: adminPassword,
    },
  });

  await prisma.utilisateur.upsert({
    where: { email: "user@ticketing.local" },
    update: {
      nom: "User",
      prenom: "Bob",
      role: "user",
      motDePasse: userPassword,
    },
    create: {
      nom: "User",
      prenom: "Bob",
      email: "user@ticketing.local",
      role: "user",
      motDePasse: userPassword,
    },
  });
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function buildSentence(): string {
  const subjects = [
    "Le système",
    "L'application",
    "Le module",
    "La page",
    "Le service",
    "La fonctionnalité",
  ];
  const verbs = [
    "ne répond pas",
    "crash",
    "retourne une erreur",
    "ne s'affiche pas correctement",
    "est lent",
    "ne sauvegarde pas les données",
  ];
  const objects = [
    "lors de la création d'un ticket",
    "sur la page d'accueil",
    "lors de la connexion",
    "lors de l'envoi du formulaire",
    "lors du chargement des données",
    "lors de la navigation entre les onglets",
  ];

  return `${randomPick(subjects)} ${randomPick(verbs)} ${randomPick(objects)}.`;
}

async function seedTickets(count = 200): Promise<void> {
  const statuts = await prisma.statut.findMany();
  const priorites = await prisma.priorite.findMany();
  const utilisateurs = await prisma.utilisateur.findMany({ select: { idUtilisateur: true } });

  if (!statuts.length || !priorites.length || !utilisateurs.length) {
    throw new Error(
      "Référentiels ou utilisateurs manquants. Exécutez d'abord `npm run db:seed` pour créer les statuts/priorités et les utilisateurs de démo."
    );
  }

  const statutMap = Object.fromEntries(statuts.map((s) => [s.libelle, s.idStatut]));
  const prioriteMap = Object.fromEntries(priorites.map((p) => [p.libelle, p.idPriorite]));
  const userIds = utilisateurs.map((u) => u.idUtilisateur);

  const existingCount = await prisma.ticket.count();
  if (existingCount >= count) {
    console.log(`Seed tickets : déjà ${existingCount} tickets (>= ${count}), rien à faire.`);
    return;
  }

  const toCreate = count - existingCount;
  const now = new Date();
  const oldest = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120); // 120 jours

  const titres = [
    "Impossible de se connecter",
    "Erreur lors de la sauvegarde",
    "Page blanche",
    "Données incorrectes",
    "Performance dégradée",
    "Problème d'affichage",
    "Manque de validations",
    "Fonctionnalité bloquante",
  ];

  const suffixes = [
    "sur l'espace client",
    "dans le tableau de bord",
    "lors de la confirmation",
    "après l'envoi du formulaire",
    "lors du chargement",
    "dans le module de recherche",
  ];

  for (let i = 0; i < toCreate; i += 1) {
    const statut = randomPick(["En attente", "En cours", "Résolu", "Clos"]);
    const priorite = randomPick(["Basse", "Moyenne", "Haute", "Critique"]);
    const createurId = randomPick(userIds);

    const dateCreation = randomDateBetween(oldest, now);
    const dateCloture = statut === "Résolu" || statut === "Clos"
      ? randomDateBetween(dateCreation, now)
      : null;

    const titre = `${randomPick(titres)} ${randomPick(suffixes)}`;
    const description = Array.from({ length: randomInt(2, 4) })
      .map(() => buildSentence())
      .join(" ");

    const ticket = await prisma.ticket.create({
      data: {
        titre,
        description,
        dateCreation,
        dateCloture,
        idStatut: statutMap[statut],
        idPriorite: prioriteMap[priorite],
        idCreateur: createurId,
      },
    });

    if (Math.random() < 0.5) {
      const commentCount = randomInt(1, 3);
      for (let c = 0; c < commentCount; c += 1) {
        await prisma.commentaire.create({
          data: {
            contenu: buildSentence(),
            dateCommentaire: randomDateBetween(dateCreation, dateCloture ?? now),
            idTicket: ticket.idTicket,
            idAuteur: randomPick(userIds),
          },
        });
      }
    }
  }

  console.log(`Seed tickets : créé ${toCreate} tickets (total ${count}).`);
}

async function main(): Promise<void> {
  await seedReferentiels();
  await seedUsers();
  await seedTickets(200);
  console.log("Seed terminé : référentiels, utilisateurs et tickets de démonstration.");
}

main()
  .catch((error) => {
    console.error("Erreur seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
