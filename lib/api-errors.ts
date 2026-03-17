import { ZodError } from "zod";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Erreur inconnue";
}

export function zodToDetails(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors;
}
