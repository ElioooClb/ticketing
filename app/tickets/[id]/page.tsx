import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { canDeleteTicket, canEditTicket } from "@/lib/permissions";
import { TicketDetailView } from "@/components/ticket-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: PageProps): Promise<React.JSX.Element> {
  const user = await requireUser();
  const { id } = await params;
  const idTicket = Number(id);

  if (!Number.isInteger(idTicket) || idTicket <= 0) {
    notFound();
  }

  const [ticket, statuts, priorites] = await Promise.all([
    prisma.ticket.findUnique({
      where: { idTicket },
      include: {
        statut: true,
        priorite: true,
        createur: {
          select: { idUtilisateur: true, nom: true, prenom: true, email: true },
        },
        commentaires: {
          include: {
            auteur: { select: { idUtilisateur: true, nom: true, prenom: true, email: true } },
          },
          orderBy: { dateCommentaire: "asc" },
        },
      },
    }),
    prisma.statut.findMany({ orderBy: { idStatut: "asc" } }),
    prisma.priorite.findMany({ orderBy: { idPriorite: "asc" } }),
  ]);

  if (!ticket) {
    notFound();
  }

  if (user.role !== "admin" && ticket.idCreateur !== user.idUtilisateur) {
    notFound();
  }

  return (
    <TicketDetailView
      ticket={{
        ...ticket,
        dateCreation: ticket.dateCreation.toISOString(),
        dateCloture: ticket.dateCloture?.toISOString() ?? null,
        commentaires: ticket.commentaires.map((comment) => ({
          ...comment,
          dateCommentaire: comment.dateCommentaire.toISOString(),
        })),
      }}
      statuts={statuts.map((s) => ({ id: s.idStatut, libelle: s.libelle }))}
      priorites={priorites.map((p) => ({ id: p.idPriorite, libelle: p.libelle }))}
      canEdit={canEditTicket(user, ticket)}
      canDelete={canDeleteTicket(user)}
    />
  );
}
