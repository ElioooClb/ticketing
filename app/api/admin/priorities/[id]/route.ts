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
    const idPriorite = parseId(id);
    if (!idPriorite) {
      return fail(400, "Identifiant invalide");
    }

    const body = await request.json();
    const parsed = referentielSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Données invalides", zodToDetails(parsed.error));
    }

    const priorite = await prisma.priorite.update({
      where: { idPriorite },
      data: { libelle: parsed.data.libelle.trim() },
    });

    return ok(priorite);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail(403, "Accès administrateur requis");
    }
    return fail(500, "Erreur serveur pendant la modification de la priorité");
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const idPriorite = parseId(id);
    if (!idPriorite) {
      return fail(400, "Identifiant invalide");
    }

    const linkedTicketsCount = await prisma.ticket.count({
      where: { idPriorite },
    });

    if (linkedTicketsCount > 0) {
      return fail(409, "Impossible de supprimer une priorité déjà utilisée par des tickets");
    }

    await prisma.priorite.delete({
      where: { idPriorite },
    });

    return ok({ message: "Priorité supprimée" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail(403, "Accès administrateur requis");
    }
    return fail(500, "Erreur serveur pendant la suppression de la priorité");
  }
}
