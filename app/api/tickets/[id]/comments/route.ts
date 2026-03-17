import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";
import { commentCreateSchema } from "@/lib/validation";
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
      select: { idTicket: true, idCreateur: true },
    });
    if (!ticket) {
      return fail(404, "Ticket introuvable");
    }
    if (user.role !== "admin" && ticket.idCreateur !== user.idUtilisateur) {
      return fail(403, "Vous ne pouvez pas consulter les commentaires de ce ticket");
    }

    const comments = await prisma.commentaire.findMany({
      where: { idTicket: ticketId },
      include: {
        auteur: { select: { idUtilisateur: true, nom: true, prenom: true, email: true } },
      },
      orderBy: { dateCommentaire: "asc" },
    });

    return ok(comments);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la récupération des commentaires");
  }
}

export async function POST(
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

    const body = await request.json();
    const parsed = commentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Commentaire invalide", zodToDetails(parsed.error));
    }

    const ticketExists = await prisma.ticket.findUnique({
      where: { idTicket: ticketId },
      select: { idTicket: true, idCreateur: true },
    });
    if (!ticketExists) {
      return fail(404, "Ticket introuvable");
    }
    if (user.role !== "admin" && ticketExists.idCreateur !== user.idUtilisateur) {
      return fail(403, "Vous ne pouvez pas commenter ce ticket");
    }

    const comment = await prisma.commentaire.create({
      data: {
        idTicket: ticketId,
        idAuteur: user.idUtilisateur,
        contenu: parsed.data.contenu,
      },
      include: {
        auteur: { select: { idUtilisateur: true, nom: true, prenom: true, email: true } },
      },
    });

    return ok(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la création du commentaire");
  }
}
