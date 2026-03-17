"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/dates";

type ReferentialItem = {
  id: number;
  libelle: string;
};

type Commentaire = {
  idCommentaire: number;
  contenu: string;
  dateCommentaire: string;
  auteur: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
  };
};

type TicketDetail = {
  idTicket: number;
  titre: string;
  description: string;
  dateCreation: string;
  dateCloture: string | null;
  idStatut: number;
  idPriorite: number;
  statut: { libelle: string };
  priorite: { libelle: string };
  createur: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
  };
  commentaires: Commentaire[];
};

type Props = {
  ticket: TicketDetail;
  statuts: ReferentialItem[];
  priorites: ReferentialItem[];
  canEdit: boolean;
  canDelete: boolean;
};

export function TicketDetailView({
  ticket,
  statuts,
  priorites,
  canEdit,
  canDelete,
}: Props): React.JSX.Element {
  const router = useRouter();

  const [titre, setTitre] = useState(ticket.titre);
  const [description, setDescription] = useState(ticket.description);
  const [idStatut, setIdStatut] = useState(ticket.idStatut);
  const [idPriorite, setIdPriorite] = useState(ticket.idPriorite);
  const [commentaire, setCommentaire] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isClosed = useMemo(() => Boolean(ticket.dateCloture), [ticket.dateCloture]);

  async function handleUpdateTicket(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/tickets/${ticket.idTicket}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre, description, idStatut, idPriorite }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Échec de la mise à jour");
        return;
      }

      setMessage("Ticket mis à jour.");
      router.refresh();
    } catch {
      setError("Erreur réseau pendant la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleClose(): Promise<void> {
    if (!canEdit) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/tickets/${ticket.idTicket}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isClosed ? "reopen" : "close" }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Échec du changement d'état");
        return;
      }

      setMessage(isClosed ? "Ticket réouvert." : "Ticket clôturé.");
      router.refresh();
    } catch {
      setError("Erreur réseau pendant le changement d'état.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!canDelete) {
      return;
    }

    const confirmDelete = window.confirm("Supprimer définitivement ce ticket ?");
    if (!confirmDelete) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tickets/${ticket.idTicket}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Échec de la suppression");
        return;
      }

      router.push("/tickets");
      router.refresh();
    } catch {
      setError("Erreur réseau pendant la suppression.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/tickets/${ticket.idTicket}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: commentaire }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Échec de l'ajout du commentaire");
        return;
      }

      setCommentaire("");
      setMessage("Commentaire ajouté.");
      router.refresh();
    } catch {
      setError("Erreur réseau pendant l'ajout du commentaire.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">
            Ticket #{ticket.idTicket} - {ticket.titre}
          </h1>
          <div className="flex gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={handleToggleClose}
                disabled={loading}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                {isClosed ? "Réouvrir" : "Clôturer"}
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-semibold">Créateur :</span> {ticket.createur.prenom} {ticket.createur.nom}
          </p>
          <p>
            <span className="font-semibold">Date création :</span> {formatDate(ticket.dateCreation)}
          </p>
          <p>
            <span className="font-semibold">Statut :</span> {ticket.statut.libelle}
          </p>
          <p>
            <span className="font-semibold">Priorité :</span> {ticket.priorite.libelle}
          </p>
          <p>
            <span className="font-semibold">Date clôture :</span> {formatDate(ticket.dateCloture)}
          </p>
        </div>

        {canEdit ? (
          <form onSubmit={handleUpdateTicket} className="space-y-3 border-t pt-4">
            <h2 className="text-lg font-semibold">Modifier le ticket</h2>
            <input
              value={titre}
              onChange={(event) => setTitre(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              required
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-md border px-3 py-2"
              required
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={idStatut}
                onChange={(event) => setIdStatut(Number(event.target.value))}
                className="rounded-md border px-3 py-2"
              >
                {statuts.map((statut) => (
                  <option key={statut.id} value={statut.id}>
                    {statut.libelle}
                  </option>
                ))}
              </select>
              <select
                value={idPriorite}
                onChange={(event) => setIdPriorite(Number(event.target.value))}
                className="rounded-md border px-3 py-2"
              >
                {priorites.map((priorite) => (
                  <option key={priorite.id} value={priorite.id}>
                    {priorite.libelle}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            >
              Enregistrer
            </button>
          </form>
        ) : (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Vous pouvez consulter ce ticket mais pas le modifier (règle RBAC).
          </p>
        )}

        {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Commentaires (ordre chronologique)</h2>

        <form onSubmit={handleAddComment} className="mb-4 space-y-2">
          <textarea
            value={commentaire}
            onChange={(event) => setCommentaire(event.target.value)}
            className="min-h-20 w-full rounded-md border px-3 py-2"
            placeholder="Ajouter un commentaire..."
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Ajouter le commentaire
          </button>
        </form>

        <div className="space-y-3">
          {ticket.commentaires.map((comment) => (
            <article key={comment.idCommentaire} className="rounded-md border p-3">
              <p className="mb-1 text-sm text-gray-600">
                {comment.auteur.prenom} {comment.auteur.nom} - {formatDate(comment.dateCommentaire)}
              </p>
              <p className="whitespace-pre-wrap text-sm">{comment.contenu}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
