import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth-constants";
import { fail, ok } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { zodToDetails } from "@/lib/api-errors";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail(400, "Données de connexion invalides", zodToDetails(parsed.error));
    }

    const user = await prisma.utilisateur.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) {
      return fail(401, "Email ou mot de passe incorrect");
    }

    const passwordOk = await verifyPassword(parsed.data.motDePasse, user.motDePasse);
    if (!passwordOk) {
      return fail(401, "Email ou mot de passe incorrect");
    }

    const token = createSessionToken({
      idUtilisateur: user.idUtilisateur,
      role: user.role,
    });

    const response = ok({
      message: "Connexion réussie",
      user: {
        idUtilisateur: user.idUtilisateur,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    return response;
  } catch {
    return fail(500, "Erreur serveur pendant la connexion");
  }
}
