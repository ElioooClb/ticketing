import { z } from "zod";

function optionalPositiveIntFromQuery(): z.ZodType<number | undefined> {
  return z.preprocess((value) => {
    // Les <select> HTML envoient "" quand "Tous ...".
    // Sans cette normalisation, z.coerce.number("") => 0 puis invalide tout l'objet de filtres.
    if (value === "" || value === null || typeof value === "undefined") {
      return undefined;
    }
    return value;
  }, z.coerce.number().int().positive().optional());
}

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  motDePasse: z.string().min(3, "Mot de passe trop court"),
});

export const ticketCreateSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(120),
  description: z.string().min(5, "La description est obligatoire"),
  idStatut: z.coerce.number().int().positive(),
  idPriorite: z.coerce.number().int().positive(),
});

export const ticketUpdateSchema = z.object({
  titre: z.string().min(3).max(120),
  description: z.string().min(5),
  idStatut: z.coerce.number().int().positive(),
  idPriorite: z.coerce.number().int().positive(),
});

export const ticketStateSchema = z.object({
  action: z.enum(["close", "reopen"]),
});

export const commentCreateSchema = z.object({
  contenu: z.string().min(2, "Le commentaire est trop court").max(1000),
});

export const referentielSchema = z.object({
  libelle: z.string().min(2, "Le libellé est trop court").max(50),
});

export const ticketFiltersSchema = z.object({
  idStatut: optionalPositiveIntFromQuery(),
  idPriorite: optionalPositiveIntFromQuery(),
  idCreateur: optionalPositiveIntFromQuery(),
  clos: z.enum(["all", "open", "closed"]).optional().default("all"),
  tri: z.enum(["recent", "oldest", "priority"]).optional().default("recent"),
});
