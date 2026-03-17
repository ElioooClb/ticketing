"use client";

import { FormEvent, useState } from "react";

type Item = {
  id: number;
  libelle: string;
};

type Props = {
  initialStatuts: Item[];
  initialPriorites: Item[];
};

type Mode = "statuses" | "priorities";

export function ReferentielsAdmin({
  initialStatuts,
  initialPriorites,
}: Props): React.JSX.Element {
  const [statuts, setStatuts] = useState(initialStatuts);
  const [priorites, setPriorites] = useState(initialPriorites);
  const [newStatut, setNewStatut] = useState("");
  const [newPriorite, setNewPriorite] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh(mode: Mode): Promise<void> {
    const endpoint = mode === "statuses" ? "/api/admin/statuses" : "/api/admin/priorities";
    const response = await fetch(endpoint);
    const data = (await response.json()) as Array<{ idStatut?: number; idPriorite?: number; libelle: string }>;
    if (!response.ok) {
      throw new Error("Erreur de rafraîchissement");
    }

    if (mode === "statuses") {
      setStatuts(data.map((item) => ({ id: item.idStatut ?? 0, libelle: item.libelle })));
    } else {
      setPriorites(data.map((item) => ({ id: item.idPriorite ?? 0, libelle: item.libelle })));
    }
  }

  async function createItem(mode: Mode, event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setMessage("");

    const value = mode === "statuses" ? newStatut : newPriorite;
    const endpoint = mode === "statuses" ? "/api/admin/statuses" : "/api/admin/priorities";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libelle: value }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Erreur de création");
      return;
    }

    if (mode === "statuses") {
      setNewStatut("");
    } else {
      setNewPriorite("");
    }
    await refresh(mode);
    setMessage("Élément créé.");
  }

  async function updateItem(mode: Mode, id: number, libelle: string): Promise<void> {
    setError("");
    setMessage("");
    const endpoint =
      mode === "statuses" ? `/api/admin/statuses/${id}` : `/api/admin/priorities/${id}`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libelle }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Erreur de modification");
      return;
    }

    await refresh(mode);
    setMessage("Élément modifié.");
  }

  async function deleteItem(mode: Mode, id: number): Promise<void> {
    const confirmDelete = window.confirm("Supprimer cet élément ?");
    if (!confirmDelete) {
      return;
    }

    setError("");
    setMessage("");
    const endpoint =
      mode === "statuses" ? `/api/admin/statuses/${id}` : `/api/admin/priorities/${id}`;

    const response = await fetch(endpoint, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Erreur de suppression");
      return;
    }

    await refresh(mode);
    setMessage("Élément supprimé.");
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Administration des référentiels</h1>
      <p className="text-sm text-gray-700">
        Cette page est réservée au rôle <strong>admin</strong> (RBAC).
      </p>

      {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-green-50 p-2 text-sm text-green-700">{message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Statuts</h2>
          <form onSubmit={(event) => createItem("statuses", event)} className="mb-3 flex gap-2">
            <input
              value={newStatut}
              onChange={(event) => setNewStatut(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Nouveau statut"
              required
            />
            <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white">Ajouter</button>
          </form>

          <div className="space-y-2">
            {statuts.map((item) => (
              <EditableRow
                key={item.id}
                item={item}
                onSave={(libelle) => updateItem("statuses", item.id, libelle)}
                onDelete={() => deleteItem("statuses", item.id)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Priorités</h2>
          <form onSubmit={(event) => createItem("priorities", event)} className="mb-3 flex gap-2">
            <input
              value={newPriorite}
              onChange={(event) => setNewPriorite(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Nouvelle priorité"
              required
            />
            <button className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white">Ajouter</button>
          </form>

          <div className="space-y-2">
            {priorites.map((item) => (
              <EditableRow
                key={item.id}
                item={item}
                onSave={(libelle) => updateItem("priorities", item.id, libelle)}
                onDelete={() => deleteItem("priorities", item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableRow({
  item,
  onSave,
  onDelete,
}: {
  item: Item;
  onSave: (libelle: string) => Promise<void>;
  onDelete: () => Promise<void>;
}): React.JSX.Element {
  const [value, setValue] = useState(item.libelle);

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => void onSave(value)}
        className="rounded-md border px-2 py-1 text-xs"
      >
        Enregistrer
      </button>
      <button
        type="button"
        onClick={() => void onDelete()}
        className="rounded-md bg-red-600 px-2 py-1 text-xs text-white"
      >
        Suppr.
      </button>
    </div>
  );
}
