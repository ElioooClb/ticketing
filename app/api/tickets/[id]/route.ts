import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";
import { canDeleteTicket, canEditTicket } from "@/lib/permissions";
import { ticketStateSchema, ticketUpdateSchema } from "@/lib/validation";
import { STATUS_CLOSED_LABEL, STATUS_RESOLVED_LABEL } from "@/lib/constants";
import { zodToDetails } from "@/lib/api-errors";

function parseTicketId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticketId = parseTicketId(id);
    if (!ticketId) {
      return fail(400, "Identifiant ticket invalide");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { idTicket: ticketId },
      include: {
        statut: true,
        priorite: true,
        createur: { select: { idUtilisateur: true, nom: true, prenom: true, email: true } },
        commentaires: {
          include: {
            auteur: {
              select: { idUtilisateur: true, nom: true, prenom: true, email: true },
            },
          },
          orderBy: { dateCommentaire: "asc" },
        },
      },
    });

    if (!ticket) {
      return fail(404, "Ticket introuvable");
    }

    if (user.role !== "admin" && ticket.idCreateur !== user.idUtilisateur) {
      return fail(403, "Vous ne pouvez pas consulter ce ticket");
    }

    return ok(ticket);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la récupération du ticket");
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticketId = parseTicketId(id);
    if (!ticketId) {
      return fail(400, "Identifiant ticket invalide");
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { idTicket: ticketId },
      select: {
        idTicket: true,
        idCreateur: true,
        statut: { select: { libelle: true } },
      },
    });
    if (!existingTicket) {
      return fail(404, "Ticket introuvable");
    }

    if (!canEditTicket(user, existingTicket)) {
      return fail(403, "Vous ne pouvez pas modifier ce ticket");
    }

    const body = await request.json();
    const parsed = ticketUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Données de mise à jour invalides", zodToDetails(parsed.error));
    }

    const targetStatus = await prisma.statut.findUnique({
      where: { idStatut: parsed.data.idStatut },
      select: { libelle: true },
    });
    if (!targetStatus) {
      return fail(400, "Statut cible introuvable");
    }

    // Règle métier: seul l'admin peut faire la transition Résolu -> Clos.
    if (
      existingTicket.statut.libelle === STATUS_RESOLVED_LABEL &&
      targetStatus.libelle === STATUS_CLOSED_LABEL &&
      user.role !== "admin"
    ) {
      return fail(403, "Seul un administrateur peut passer un ticket de Résolu à Clos");
    }

    const updated = await prisma.ticket.update({
      where: { idTicket: ticketId },
      data: {
        titre: parsed.data.titre,
        description: parsed.data.description,
        idStatut: parsed.data.idStatut,
        idPriorite: parsed.data.idPriorite,
      },
      include: {
        statut: true,
        priorite: true,
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la mise à jour du ticket");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticketId = parseTicketId(id);
    if (!ticketId) {
      return fail(400, "Identifiant ticket invalide");
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { idTicket: ticketId },
      select: {
        idTicket: true,
        idCreateur: true,
        statut: { select: { libelle: true } },
      },
    });
    if (!existingTicket) {
      return fail(404, "Ticket introuvable");
    }

    if (!canEditTicket(user, existingTicket)) {
      return fail(403, "Vous ne pouvez pas changer l'état de ce ticket");
    }

    const body = await request.json();
    const parsed = ticketStateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Action invalide", zodToDetails(parsed.error));
    }

    let idStatutToApply: number | undefined;
    if (parsed.data.action === "close") {
      if (existingTicket.statut.libelle === STATUS_RESOLVED_LABEL && user.role !== "admin") {
        return fail(403, "Seul un administrateur peut passer un ticket de Résolu à Clos");
      }

      const closedStatus = await prisma.statut.findFirst({
        where: { libelle: STATUS_CLOSED_LABEL },
      });
      idStatutToApply = closedStatus?.idStatut;
    }

    const updated = await prisma.ticket.update({
      where: { idTicket: ticketId },
      data:
        parsed.data.action === "close"
          ? { dateCloture: new Date(), ...(idStatutToApply ? { idStatut: idStatutToApply } : {}) }
          : { dateCloture: null },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant le changement d'état");
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticketId = parseTicketId(id);
    if (!ticketId) {
      return fail(400, "Identifiant ticket invalide");
    }

    if (!canDeleteTicket(user)) {
      return fail(403, "Seul un administrateur peut supprimer un ticket");
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { idTicket: ticketId },
      select: { idTicket: true },
    });
    if (!existingTicket) {
      return fail(404, "Ticket introuvable");
    }

    await prisma.ticket.delete({
      where: { idTicket: ticketId },
    });

    return ok({ message: "Ticket supprimé" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la suppression");
  }
}
