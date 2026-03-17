import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";
import { referentielSchema } from "@/lib/validation";
import { zodToDetails } from "@/lib/api-errors";

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const idStatut = parseId(id);
    if (!idStatut) {
      return fail(400, "Identifiant invalide");
    }

    const body = await request.json();
    const parsed = referentielSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Données invalides", zodToDetails(parsed.error));
    }

    const statut = await prisma.statut.update({
      where: { idStatut },
      data: { libelle: parsed.data.libelle.trim() },
    });

    return ok(statut);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail(403, "Accès administrateur requis");
    }
    return fail(500, "Erreur serveur pendant la modification du statut");
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const idStatut = parseId(id);
    if (!idStatut) {
      return fail(400, "Identifiant invalide");
    }

    const linkedTicketsCount = await prisma.ticket.count({
      where: { idStatut },
    });

    if (linkedTicketsCount > 0) {
      return fail(409, "Impossible de supprimer un statut déjà utilisé par des tickets");
    }

    await prisma.statut.delete({
      where: { idStatut },
    });

    return ok({ message: "Statut supprimé" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail(403, "Accès administrateur requis");
    }
    return fail(500, "Erreur serveur pendant la suppression du statut");
  }
}
