import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "@/components/logout-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticketing IT - BTS SIO",
  description: "Application locale de gestion de tickets IT",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <Link href={user ? "/tickets" : "/login"} className="text-lg font-bold">
                  Ticketing IT
                </Link>
                {user ? (
                  <nav className="flex items-center gap-3 text-sm text-gray-700">
                    <Link href="/tickets" className="hover:underline">
                      Tickets
                    </Link>
                    <Link href="/tickets/new" className="hover:underline">
                      Nouveau
                    </Link>
                    <Link href="/a-propos" className="hover:underline">
                      Aide
                    </Link>
                    {user.role === "admin" ? (
                      <Link href="/admin/referentiels" className="hover:underline">
                        Référentiels
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-700">
                    {user.prenom} {user.nom} ({user.role})
                  </p>
                  <LogoutButton />
                </div>
              ) : null}
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
