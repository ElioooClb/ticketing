import { PrismaClient } from "@prisma/client";

declare global {
  // Empêche de créer plusieurs instances en mode développement (hot reload).
  // Sans cela, Prisma peut ouvrir trop de connexions.
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
