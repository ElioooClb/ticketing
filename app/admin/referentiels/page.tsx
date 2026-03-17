import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/current-user";
import { ReferentielsAdmin } from "@/components/referentiels-admin";

export default async function ReferentielsPage(): Promise<React.JSX.Element> {
  await requireAdmin();
  const [statuts, priorites] = await Promise.all([
    prisma.statut.findMany({ orderBy: { idStatut: "asc" } }),
    prisma.priorite.findMany({ orderBy: { idPriorite: "asc" } }),
  ]);

  return (
    <ReferentielsAdmin
      initialStatuts={statuts.map((item: (typeof statuts)[number]) => ({ id: item.idStatut, libelle: item.libelle }))}
      initialPriorites={priorites.map((item: (typeof priorites)[number]) => ({ id: item.idPriorite, libelle: item.libelle }))}
    />
  );
}
