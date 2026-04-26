"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

export default function SignupPage() {
  const t = useT();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError(t("signup.errPasswordTooShort"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("signup.errGeneric"));
      }

      router.push(`/login?message=${encodeURIComponent(t("signup.successMessage"))}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="aso-anim-fade-rise card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("signup.title")}</h1>
        <p className="text-sm text-foreground/70">{t("signup.subtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="aso-anim-fade-rise card space-y-3 p-6" style={{ animationDelay: "60ms" }}>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t("common.firstName")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder={t("common.lastName")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <input
          type="email"
          placeholder={t("common.email")}
          className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <input
            type="password"
            placeholder={t("common.password")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-foreground/60 mt-1">{t("signup.passwordHint")}</p>
        </div>
        {error && (
          <p key={error} className="aso-anim-shake text-sm text-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t("signup.submitting") : t("signup.submit")}
        </button>
        <Link href="/login" className="text-center text-sm text-primary">
          {t("signup.alreadyMember")}
        </Link>
      </form>
    </div>
  );
}
