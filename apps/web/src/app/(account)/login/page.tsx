"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion");
      }

      login(data.access_token, data.user);
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-6">
      {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Connexion en cours..." : "Se connecter"}
      </button>
      <Link href="/signup" className="text-center text-sm text-primary">
        Créer un compte
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-600">Connectez-vous pour accéder à votre compte.</p>
      </div>
      <Suspense fallback={<div className="card p-6">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
