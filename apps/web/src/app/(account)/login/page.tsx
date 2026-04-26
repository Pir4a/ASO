"use client";

import { useEffect, useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // MFA-challenge state — set when /auth/login replies { mfaRequired, challengeToken }.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) setSuccessMessage(message);
  }, [searchParams]);

  const finishLogin = async (
    accessToken: string,
    user: Parameters<typeof login>[1],
  ) => {
    await login(accessToken, user);
    const target =
      searchParams.get("redirect") ?? searchParams.get("return_to");
    router.push(target && target.startsWith("/") ? target : "/");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erreur de connexion");
      // Two-step path: server says MFA is required; swap to the code prompt.
      if (data.mfaRequired && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        return;
      }
      await finishLogin(data.access_token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/mfa/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeToken, code: mfaCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Code incorrect.");
      await finishLogin(data.access_token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Code MFA incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  const labelCls =
    "mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65";

  if (challengeToken) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-5">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-3 text-[13px] text-foreground/80">
          <p className="font-semibold text-foreground">Vérification en deux étapes</p>
          <p className="mt-1 text-[12.5px] text-foreground/65">
            Saisissez le code à 6 chiffres généré par votre application
            d&apos;authentification, ou un code de secours.
          </p>
        </div>
        <div>
          <label htmlFor="mfa-code" className={labelCls}>Code</label>
          <input
            id="mfa-code"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="123 456"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className={`${inputCls} font-mono tracking-[0.2em]`}
          />
        </div>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[13px] text-error"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="8" cy="8" r="6" />
              <path d="m4.5 4.5 7 7" />
            </svg>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ color: "#fff" }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Vérification…
            </>
          ) : (
            "Vérifier"
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setChallengeToken(null);
            setMfaCode("");
            setError(null);
          }}
          className="block w-full text-center text-[12.5px] font-semibold text-foreground/60 transition hover:text-primary"
        >
          ← Revenir à la connexion
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-[13px] text-success"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="m3 8 3.5 3.5L13 5" />
          </svg>
          {successMessage}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className={labelCls}>Email</label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="login-password" className={labelCls}>
            Mot de passe
          </label>
          <Link
            href="/forgot-password"
            className="text-[12px] font-semibold text-primary transition hover:text-primary-hover"
          >
            Mot de passe oublié&nbsp;?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-foreground/55 transition hover:bg-background hover:text-primary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5">
              {showPassword ? (
                <>
                  <path d="M2 2l12 12" />
                  <path d="M3 8s2-4 5-4M13 8s-2 4-5 4" />
                </>
              ) : (
                <>
                  <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                  <circle cx="8" cy="8" r="2" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-foreground/10 bg-background/40 px-3.5 py-3">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-foreground/25 text-primary focus:ring-2 focus:ring-primary/30"
        />
        <span>
          <span className="block font-heading text-[13.5px] font-semibold text-foreground">
            Se souvenir de moi
          </span>
          <span className="mt-0.5 block text-[11.5px] text-foreground/60">
            Garde la session active 7 jours sur cet appareil.
          </span>
        </span>
      </label>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[13px] text-error"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
            <circle cx="8" cy="8" r="6" />
            <path d="m4.5 4.5 7 7" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ color: "#fff" }}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connexion en cours…
          </>
        ) : (
          <>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M6 2H3v12h3M10 5l3 3-3 3M6 8h7" />
            </svg>
            Se connecter
          </>
        )}
      </button>

      <p className="text-center text-[12.5px] text-foreground/65">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:text-primary-hover">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">Connexion</span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
        <header className="border-b border-foreground/5 px-6 py-5">
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
            Mon compte
          </p>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground">
            Connectez-vous
          </h1>
          <p className="mt-1 text-[13px] text-foreground/60">
            Accédez à vos commandes, adresses et moyens de paiement.
          </p>
        </header>
        <div className="px-6 py-6">
          <Suspense
            fallback={
              <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-12 text-center text-sm text-foreground/55">
                Chargement…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
