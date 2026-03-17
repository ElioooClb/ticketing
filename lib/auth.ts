import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth-constants";

export type SessionUser = {
  idUtilisateur: number;
  role: "admin" | "user";
  nom: string;
  prenom: string;
  email: string;
};

export type SessionPayload = {
  idUtilisateur: number;
  role: "admin" | "user";
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET manquant dans .env");
  }
  return secret;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSessionSecret()).update(payloadB64).digest("base64url");
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function makeToken(payload: SessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadB64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: Pick<SessionUser, "idUtilisateur" | "role">): string {
  const exp = Date.now() + SESSION_DURATION_SECONDS * 1000;
  return makeToken({ idUtilisateur: user.idUtilisateur, role: user.role, exp });
}

export async function readSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return parseSessionToken(token);
}
