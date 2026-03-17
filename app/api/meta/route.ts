import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";

export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();

    const [statuts, priorites, utilisateurs] = await Promise.all([
      prisma.statut.findMany({ orderBy: { idStatut: "asc" } }),
      prisma.priorite.findMany({ orderBy: { idPriorite: "asc" } }),
      prisma.utilisateur.findMany({
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        select: { idUtilisateur: true, nom: true, prenom: true, email: true, role: true },
      }),
    ]);

    return ok({ statuts, priorites, utilisateurs });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant le chargement des données");
  }
}
