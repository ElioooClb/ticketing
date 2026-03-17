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

async function main(): Promise<void> {
  await seedReferentiels();
  await seedUsers();
  console.log("Seed terminé: référentiels + utilisateurs de démo.");
}

main()
  .catch((error) => {
    console.error("Erreur seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
