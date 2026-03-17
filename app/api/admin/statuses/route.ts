import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";
import { referentielSchema } from "@/lib/validation";
import { zodToDetails } from "@/lib/api-errors";

export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();
    const statuts = await prisma.statut.findMany({
      orderBy: { idStatut: "asc" },
    });
    return ok(statuts);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la récupération des statuts");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = referentielSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Données invalides", zodToDetails(parsed.error));
    }

    const statut = await prisma.statut.create({
      data: { libelle: parsed.data.libelle.trim() },
    });

    return ok(statut, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail(403, "Accès administrateur requis");
    }
    return fail(500, "Erreur serveur pendant la création du statut");
  }
}
