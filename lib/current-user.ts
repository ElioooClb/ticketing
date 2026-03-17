import { prisma } from "@/lib/prisma";
import { readSessionPayload, SessionUser } from "@/lib/auth";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const payload = await readSessionPayload();
  if (!payload) {
    return null;
  }

  const user = await prisma.utilisateur.findUnique({
    where: { idUtilisateur: payload.idUtilisateur },
    select: {
      idUtilisateur: true,
      role: true,
      nom: true,
      prenom: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
