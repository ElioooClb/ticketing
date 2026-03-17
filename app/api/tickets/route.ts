import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/http";
import { ticketCreateSchema, ticketFiltersSchema } from "@/lib/validation";
import { zodToDetails } from "@/lib/api-errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsedFilters = ticketFiltersSchema.safeParse(params);
    if (!parsedFilters.success) {
      return fail(400, "Filtres invalides", zodToDetails(parsedFilters.error));
    }

    const filters = parsedFilters.data;

    const where = {
      ...(filters.q
        ? {
            OR: [
              { titre: { contains: filters.q } },
              { description: { contains: filters.q } },
            ],
        }
      : {}),
    ...(filters.idStatut ? { idStatut: filters.idStatut } : {}),
    ...(filters.idPriorite ? { idPriorite: filters.idPriorite } : {}),
    ...(user.role === "admin"
      ? filters.idCreateur
        ? { idCreateur: filters.idCreateur }
        : {}
      : { idCreateur: user.idUtilisateur }),
    ...(filters.clos === "open" ? { dateCloture: null } : {}),
    ...(filters.clos === "closed" ? { NOT: { dateCloture: null } } : {}),
  };

    const orderBy =
      filters.tri === "oldest"
        ? [{ dateCreation: "asc" as const }]
        : filters.tri === "priority"
          ? [{ idPriorite: "desc" as const }, { dateCreation: "desc" as const }]
          : [{ dateCreation: "desc" as const }];

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        statut: true,
        priorite: true,
        createur: {
          select: { idUtilisateur: true, nom: true, prenom: true, email: true },
        },
        _count: {
          select: { commentaires: true },
        },
      },
      orderBy,
    });

    return ok(tickets);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la récupération des tickets");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = ticketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return fail(400, "Données ticket invalides", zodToDetails(parsed.error));
    }

    const statut = await prisma.statut.findUnique({ where: { idStatut: parsed.data.idStatut } });
    const priorite = await prisma.priorite.findUnique({ where: { idPriorite: parsed.data.idPriorite } });

    if (!statut || !priorite) {
      return fail(400, "Statut ou priorité introuvable");
    }

    // BTS SIO: ce bloc force la cardinalité Ticket 1..n Commentaires du MCD.
    // Dès la création d'un ticket, un premier commentaire "système" est créé.
    const ticket = await prisma.ticket.create({
      data: {
        titre: parsed.data.titre,
        description: parsed.data.description,
        idStatut: parsed.data.idStatut,
        idPriorite: parsed.data.idPriorite,
        idCreateur: user.idUtilisateur,
        commentaires: {
          create: {
            contenu: `Création du ticket : ${parsed.data.description}`,
            idAuteur: user.idUtilisateur,
          },
        },
      },
      include: {
        statut: true,
        priorite: true,
        createur: { select: { idUtilisateur: true, nom: true, prenom: true, email: true } },
      },
    });

    return ok(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail(401, "Utilisateur non connecté");
    }
    return fail(500, "Erreur serveur pendant la création du ticket");
  }
}
