import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { TicketCreateForm } from "@/components/ticket-create-form";

export default async function NewTicketPage(): Promise<React.JSX.Element> {
  await requireUser();
  const [statuts, priorites] = await Promise.all([
    prisma.statut.findMany({ orderBy: { idStatut: "asc" } }),
    prisma.priorite.findMany({ orderBy: { idPriorite: "asc" } }),
  ]);

  return (
    <TicketCreateForm
      statuts={statuts.map((s) => ({ id: s.idStatut, libelle: s.libelle }))}
      priorites={priorites.map((p) => ({ id: p.idPriorite, libelle: p.libelle }))}
    />
  );
}
