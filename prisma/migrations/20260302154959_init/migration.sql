-- CreateTable
CREATE TABLE "Utilisateur" (
    "idUtilisateur" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Ticket" (
    "idTicket" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCloture" DATETIME,
    "idStatut" INTEGER NOT NULL,
    "idPriorite" INTEGER NOT NULL,
    "idCreateur" INTEGER NOT NULL,
    CONSTRAINT "Ticket_idStatut_fkey" FOREIGN KEY ("idStatut") REFERENCES "Statut" ("idStatut") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_idPriorite_fkey" FOREIGN KEY ("idPriorite") REFERENCES "Priorite" ("idPriorite") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_idCreateur_fkey" FOREIGN KEY ("idCreateur") REFERENCES "Utilisateur" ("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "idCommentaire" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contenu" TEXT NOT NULL,
    "dateCommentaire" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idTicket" INTEGER NOT NULL,
    "idAuteur" INTEGER NOT NULL,
    CONSTRAINT "Commentaire_idTicket_fkey" FOREIGN KEY ("idTicket") REFERENCES "Ticket" ("idTicket") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Commentaire_idAuteur_fkey" FOREIGN KEY ("idAuteur") REFERENCES "Utilisateur" ("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Statut" (
    "idStatut" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "libelle" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Priorite" (
    "idPriorite" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "libelle" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE INDEX "Ticket_idStatut_idx" ON "Ticket"("idStatut");

-- CreateIndex
CREATE INDEX "Ticket_idPriorite_idx" ON "Ticket"("idPriorite");

-- CreateIndex
CREATE INDEX "Ticket_idCreateur_idx" ON "Ticket"("idCreateur");

-- CreateIndex
CREATE INDEX "Commentaire_idTicket_dateCommentaire_idx" ON "Commentaire"("idTicket", "dateCommentaire");

-- CreateIndex
CREATE INDEX "Commentaire_idAuteur_idx" ON "Commentaire"("idAuteur");

-- CreateIndex
CREATE UNIQUE INDEX "Statut_libelle_key" ON "Statut"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "Priorite_libelle_key" ON "Priorite"("libelle");
