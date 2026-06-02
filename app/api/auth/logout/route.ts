import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { ok } from "@/lib/http";

export async function POST(): Promise<NextResponse> {
  const response = ok({ message: "Déconnexion réussie" });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    maxAge: 0,
    path: "/",
  });
  return response;
}
