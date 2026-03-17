"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReferentialItem = {
  id: number;
  libelle: string;
};

type Props = {
  statuts: ReferentialItem[];
  priorites: ReferentialItem[];
};

export function TicketCreateForm({ statuts, priorites }: Props): React.JSX.Element {
  const router = useRouter();
  const defaultStatutId =
    statuts.find((statut) => statut.libelle === "En attente")?.id ?? statuts[0]?.id ?? 1;

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [idStatut, setIdStatut] = useState(defaultStatutId);
  const [idPriorite, setIdPriorite] = useState(priorites[1]?.id ?? priorites[0]?.id ?? 1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, description, idStatut, idPriorite }),
      });

      const data = (await response.json()) as { error?: string; idTicket?: number };
      if (!response.ok) {
        setError(data.error ?? "Erreur de création");
        return;
      }

      router.push(`/tickets/${data.idTicket}`);
      router.refresh();
    } catch {
      setError("Erreur réseau pendant la création du ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-5">
      <h1 className="text-2xl font-bold">Nouveau ticket</h1>

      <div className="space-y-1">
        <label htmlFor="titre" className="text-sm font-medium">
          Titre
        </label>
        <input
          id="titre"
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-28 w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="statut" className="text-sm font-medium">
            Statut
          </label>
          <select
            id="statut"
            value={idStatut}
            onChange={(event) => setIdStatut(Number(event.target.value))}
            className="w-full rounded-md border px-3 py-2"
          >
            {statuts.map((statut) => (
              <option key={statut.id} value={statut.id}>
                {statut.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="priorite" className="text-sm font-medium">
            Priorité
          </label>
          <select
            id="priorite"
            value={idPriorite}
            onChange={(event) => setIdPriorite(Number(event.target.value))}
            className="w-full rounded-md border px-3 py-2"
          >
            {priorites.map((priorite) => (
              <option key={priorite.id} value={priorite.id}>
                {priorite.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer le ticket"}
      </button>
    </form>
  );
}
