"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { isPasswordTooWeakApiMessage, firstHttpErrorMessage } from "@/lib/password-api-error";
import { passwordMeetsPolicy, getPasswordMissingSummary } from "@/lib/password-policy";
import { PasswordRequirementHints } from "@/components/account/PasswordRequirementHints";
import { useT } from "@/context/LocaleContext";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!passwordMeetsPolicy(password)) {
      setError(getPasswordMissingSummary(password, t) || t("auth.password.tooWeak"));
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

      const data = (await response.json()) as { message?: unknown };

      if (!response.ok) {
        if (isPasswordTooWeakApiMessage(data.message)) {
          setError(getPasswordMissingSummary(password, t) || t("auth.password.tooWeak"));
          return;
        }
        setError(firstHttpErrorMessage(data.message) ?? t("auth.signup.errorRegisterGeneric"));
        return;
      }

      router.push("/login?success=signup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.signup.errorUnknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("auth.signup.title")}</h1>
        <p className="text-sm text-foreground/70">
          {t("auth.signup.subtitle")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-3 p-6">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t("auth.signup.firstNamePlaceholder")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder={t("auth.signup.lastNamePlaceholder")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <input
          type="email"
          placeholder={t("auth.signup.emailPlaceholder")}
          className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <input
            type="password"
            placeholder={t("auth.signup.passwordPlaceholder")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordRequirementHints password={password} />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t("auth.signup.submitLoading") : t("auth.signup.submit")}
        </button>
        <Link href="/login" className="text-center text-sm text-primary">
          {t("auth.signup.alreadyHaveAccount")}
        </Link>
      </form>
    </div>
  );
}
