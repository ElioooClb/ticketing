export default function AboutPage(): React.JSX.Element {
  return (
    <section className="space-y-4 rounded-lg border bg-white p-5">
      <h1 className="text-2xl font-bold">Aide / À propos</h1>
      <p>
        Cette application gère le support IT via des tickets.
      </p>
      <p>
        Un utilisateur se connecte, crée un ticket, puis suit son traitement.
      </p>
      <p>
        Chaque ticket possède un statut, une priorité et un créateur unique.
      </p>
      <p>
        Les commentaires sont affichés dans l&apos;ordre chronologique pour tracer les échanges.
      </p>
      <p>
        Les filtres permettent de trier la liste par statut, priorité, créateur et état (ouvert/clos).
      </p>
      <p>
        Le rôle <strong>user</strong> peut créer, consulter et commenter, et modifier uniquement ses tickets.
      </p>
      <p>
        Le rôle <strong>admin</strong> dispose de tous les droits, dont la suppression des tickets.
      </p>
      <p>
        L&apos;admin gère aussi les référentiels (statuts et priorités).
      </p>
      <p>
        Les mots de passe sont stockés hachés, jamais en clair.
      </p>
      <p>
        L&apos;authentification repose sur un cookie de session HTTP-only.
      </p>
      <p>
        Le middleware contrôle l&apos;accès aux pages, et les routes API contrôlent les autorisations réelles.
      </p>
      <p>
        Prisma simplifie l&apos;accès SQL tout en gardant un schéma relationnel explicite.
      </p>
      <p>
        SQLite rend le projet local, léger et facile à démontrer pendant la soutenance.
      </p>
      <p>
        L&apos;objectif BTS SIO est de montrer une solution claire, maintenable et justifiable.
      </p>
    </section>
  );
}
