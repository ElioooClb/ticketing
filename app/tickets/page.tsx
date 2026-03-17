import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { formatDate } from "@/lib/dates";
import { ticketFiltersSchema } from "@/lib/validation";
import { z } from "zod";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TicketsPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const user = await requireUser();
  const rawParams = await searchParams;
  const flatParams = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );

  const parsed = ticketFiltersSchema.safeParse(flatParams);
  const filters: z.infer<typeof ticketFiltersSchema> = parsed.success
    ? parsed.data
    : {
        idStatut: undefined,
        idPriorite: undefined,
        idCreateur: undefined,
        clos: "all",
        tri: "recent",
      };

  const ticketWhere = {
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

  const [statuts, priorites, utilisateurs, tickets] = await Promise.all([
    prisma.statut.findMany({ orderBy: { idStatut: "asc" } }),
    prisma.priorite.findMany({ orderBy: { idPriorite: "asc" } }),
    user.role === "admin"
      ? prisma.utilisateur.findMany({
          orderBy: [{ nom: "asc" }, { prenom: "asc" }],
          select: { idUtilisateur: true, nom: true, prenom: true },
        })
      : prisma.utilisateur.findMany({
          where: { idUtilisateur: user.idUtilisateur },
          select: { idUtilisateur: true, nom: true, prenom: true },
        }),
    prisma.ticket.findMany({
      where: ticketWhere,
      include: {
        statut: true,
        priorite: true,
        createur: {
          select: { nom: true, prenom: true, idUtilisateur: true },
        },
        _count: { select: { commentaires: true } },
      },
      orderBy:
        filters.tri === "oldest"
          ? [{ dateCreation: "asc" as const }]
          : filters.tri === "priority"
            ? [{ idPriorite: "desc" as const }, { dateCreation: "desc" as const }]
            : [{ dateCreation: "desc" as const }],
    }),
  ]);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Link href="/tickets/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Créer un ticket
        </Link>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 md:grid-cols-5">
        <select name="idStatut" defaultValue={flatParams.idStatut?.toString() ?? ""} className="rounded-md border px-2 py-2">
          <option value="">Tous statuts</option>
          {statuts.map((statut) => (
            <option key={statut.idStatut} value={statut.idStatut}>
              {statut.libelle}
            </option>
          ))}
        </select>

        <select name="idPriorite" defaultValue={flatParams.idPriorite?.toString() ?? ""} className="rounded-md border px-2 py-2">
          <option value="">Toutes priorités</option>
          {priorites.map((priorite) => (
            <option key={priorite.idPriorite} value={priorite.idPriorite}>
              {priorite.libelle}
            </option>
          ))}
        </select>

        {user.role === "admin" ? (
          <select name="idCreateur" defaultValue={flatParams.idCreateur?.toString() ?? ""} className="rounded-md border px-2 py-2">
            <option value="">Tous créateurs</option>
            {utilisateurs.map((u) => (
              <option key={u.idUtilisateur} value={u.idUtilisateur}>
                {u.prenom} {u.nom}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="idCreateur" value={user.idUtilisateur} />
        )}

        <select name="clos" defaultValue={flatParams.clos?.toString() ?? "all"} className="rounded-md border px-2 py-2">
          <option value="all">Ouverts + clos</option>
          <option value="open">Ouverts</option>
          <option value="closed">Clos</option>
        </select>

        <select name="tri" defaultValue={flatParams.tri?.toString() ?? "recent"} className="rounded-md border px-2 py-2">
          <option value="recent">Tri: plus récents</option>
          <option value="oldest">Tri: plus anciens</option>
          <option value="priority">Tri: priorité</option>
        </select>

        <div className="md:col-span-5 flex gap-2">
          <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
            Filtrer
          </button>
          <Link href="/tickets" className="rounded-md border px-4 py-2 text-sm">
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Priorité</th>
              <th className="px-3 py-2">Créateur</th>
              <th className="px-3 py-2">Création</th>
              <th className="px-3 py-2">Commentaires</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Aucun ticket trouvé avec ces filtres.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.idTicket} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/tickets/${ticket.idTicket}`} className="font-medium text-blue-700 hover:underline">
                      #{ticket.idTicket} - {ticket.titre}
                    </Link>
                    {user.idUtilisateur === ticket.createur.idUtilisateur ? (
                      <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Mes tickets</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{ticket.statut.libelle}</td>
                  <td className="px-3 py-2">{ticket.priorite.libelle}</td>
                  <td className="px-3 py-2">
                    {ticket.createur.prenom} {ticket.createur.nom}
                  </td>
                  <td className="px-3 py-2">{formatDate(ticket.dateCreation)}</td>
                  <td className="px-3 py-2">{ticket._count.commentaires}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
