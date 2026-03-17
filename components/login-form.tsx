"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ticketing.local");
  const [motDePasse, setMotDePasse] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Erreur de connexion");
        return;
      }

      router.push("/tickets");
      router.refresh();
    } catch {
      setError("Erreur réseau pendant la connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="text-sm text-gray-600">
        Connecte-toi avec un compte de démo pour tester l&apos;application.
      </p>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={motDePasse}
          onChange={(event) => setMotDePasse(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
