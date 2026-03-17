"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60"
    >
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
