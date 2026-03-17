import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

function readRoleFromCookieUnsafe(token: string): "admin" | "user" | null {
  // Middleware Next.js s'exécute côté Edge: ici on lit uniquement le payload pour orienter la navigation.
  // La sécurité réelle est assurée dans les routes API qui, elles, vérifient la signature du cookie.
  const [payloadB64] = token.split(".");
  if (!payloadB64) {
    return null;
  }

  try {
    const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson) as {
      role?: "admin" | "user";
      exp?: number;
    };
    if (!payload.role || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload.role;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isPublicRoute = pathname === "/login";
  const isAuthRoute = pathname.startsWith("/tickets") || pathname.startsWith("/admin") || pathname === "/";
  const isAdminRoute = pathname.startsWith("/admin");

  const role = sessionCookie ? readRoleFromCookieUnsafe(sessionCookie) : null;
  const isLoggedIn = Boolean(role);

  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  if (isAuthRoute && !isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/tickets/:path*", "/admin/:path*"],
};
