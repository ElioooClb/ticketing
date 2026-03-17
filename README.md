# Application Web Ticketing IT (BTS SIO SLAM - E5)

Projet local complet de gestion de tickets IT, développé avec :
- **Next.js (App Router) + TypeScript**
- **Prisma ORM + SQLite**
- **Tailwind CSS**
- **Authentification maison par cookie de session signé**

L'objectif est d'avoir un code **simple, lisible, défendable à l'oral**, et strictement cohérent avec le MCD demandé.

## 1) Installation et lancement

Prérequis : Node.js 20+.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Application disponible sur `http://localhost:3000`.

## 2) Comptes de démonstration

- **Admin** : `admin@ticketing.local` / `admin123`
- **User** : `user@ticketing.local` / `user123`

> Les mots de passe sont stockés hachés (`bcrypt`), jamais en clair.

## 3) Arborescence principale

```txt
ticketing/
├─ app/
│  ├─ api/
│  │  ├─ auth/login, auth/logout
│  │  ├─ tickets, tickets/[id], tickets/[id]/comments
│  │  ├─ admin/statuses, admin/statuses/[id]
│  │  ├─ admin/priorities, admin/priorities/[id]
│  │  └─ meta
│  ├─ login
│  ├─ tickets
│  │  ├─ new
│  │  └─ [id]
│  ├─ admin/referentiels
│  ├─ a-propos
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ login-form.tsx
│  ├─ logout-button.tsx
│  ├─ ticket-create-form.tsx
│  ├─ ticket-detail.tsx
│  └─ referentiels-admin.tsx
├─ lib/
│  ├─ auth.ts
│  ├─ current-user.ts
│  ├─ permissions.ts
│  ├─ validation.ts
│  ├─ prisma.ts
│  ├─ dates.ts
│  ├─ http.ts
│  ├─ api-errors.ts
│  └─ constants.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ proxy.ts
└─ .env
```

## 4) Modèle de données (MCD -> Prisma)

Le schéma est défini dans `prisma/schema.prisma`.

### Entités

- `Utilisateur`: `idUtilisateur (PK)`, `nom`, `prenom`, `email (unique)`, `motDePasse (hash)`, `role`
- `Ticket`: `idTicket (PK)`, `titre`, `description`, `dateCreation`, `dateCloture (nullable)`
- `Commentaire`: `idCommentaire (PK)`, `contenu`, `dateCommentaire`
- `Statut`: `idStatut (PK)`, `libelle`
- `Priorite`: `idPriorite (PK)`, `libelle`

### Cardinalités implémentées

- **Ticket -> Statut** : exactement 1 (`idStatut` obligatoire)
- **Ticket -> Priorite** : exactement 1 (`idPriorite` obligatoire)
- **Ticket -> Utilisateur (créateur)** : exactement 1 (`idCreateur` obligatoire)
- **Ticket -> Commentaire** : 1..n (contrainte métier : un commentaire est créé automatiquement à l'ouverture du ticket)
- **Commentaire -> Ticket** : exactement 1 (`idTicket` obligatoire)
- **Commentaire -> Utilisateur (auteur)** : exactement 1 (`idAuteur` obligatoire)
- **Statut -> Tickets** : 0..n
- **Priorite -> Tickets** : 0..n
- **Utilisateur -> Tickets créés** : 1..n côté métier
- **Utilisateur -> Commentaires** : 0..n

## 5) Authentification et sécurité

### Principe

- Route `POST /api/auth/login`
  - validation des entrées (`zod`)
  - vérification du mot de passe hashé (`bcrypt`)
  - création d'un cookie de session HTTP-only signé (HMAC)
- Route `POST /api/auth/logout`
  - suppression du cookie de session

### Contrôle d'accès (RBAC)

- `role = admin`
  - accès complet
  - suppression ticket
  - gestion statuts/priorités
- `role = user`
  - créer/voir/commenter uniquement ses tickets
  - modifier uniquement ses tickets

Les règles sont centralisées dans :
- `lib/current-user.ts` (requireUser / requireAdmin)
- `lib/permissions.ts` (`canEditTicket`, `canDeleteTicket`)
- `proxy.ts` (protection d'accès aux pages)

## 6) Fonctionnalités livrées

1. Authentification login/logout
2. CRUD ticket : créer, lister, voir détail, modifier, clôturer/réouvrir, supprimer (admin)
3. Référentiels statut/priorité : seed + CRUD via `/admin/referentiels`
4. Commentaires : affichage chronologique + ajout
5. Filtres et tri : statut, priorité, créateur, ouvert/clos, tri
6. Page d'aide : `/a-propos`

## 7) Routes API principales

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `PATCH /api/tickets/:id` (`close` / `reopen`)
- `DELETE /api/tickets/:id` (admin)
- `GET /api/tickets/:id/comments`
- `POST /api/tickets/:id/comments`
- `GET/POST /api/admin/statuses` (POST admin)
- `PUT/DELETE /api/admin/statuses/:id` (admin)
- `GET/POST /api/admin/priorities` (POST admin)
- `PUT/DELETE /api/admin/priorities/:id` (admin)

## 8) Checklist de tests manuels (E5)

- [ ] Login admin avec identifiants seed
- [ ] Login user avec identifiants seed
- [ ] Refus login mauvais mot de passe
- [ ] Création ticket valide (user)
- [ ] Vérifier présence du commentaire automatique à la création (cardinalité 1..n)
- [ ] Ajout commentaire sur ticket
- [ ] Tri chronologique des commentaires
- [ ] User modifie son propre ticket
- [ ] User ne peut pas modifier le ticket d'un autre utilisateur
- [ ] User ne peut pas accéder à `/admin/referentiels`
- [ ] Admin peut créer/modifier/supprimer statut non utilisé
- [ ] Admin ne peut pas supprimer un statut/priorité déjà lié à un ticket
- [ ] Clôturer puis réouvrir un ticket
- [ ] Filtrer la liste par statut/priorité/créateur/ouvert-clos
- [ ] Admin supprime un ticket

## 9) Choix techniques expliquables (oral)

- **Prisma + SQLite** : base locale légère, relationnel clair, migrations simples.
- **Auth maison** : peu de magie, flux complet maîtrisé (hash + cookie signé).
- **Validation Zod** : erreurs propres et exploitables côté API.
- **RBAC explicite** : règles métier lisibles dans des fonctions dédiées.
- **Commentaires pédagogiques** : présents aux endroits critiques (MCD, sécurité, RBAC).

## 10) Scripts utiles

```bash
npm run dev
npm run lint
npm run db:migrate
npm run db:seed
npm run prisma:generate
```
