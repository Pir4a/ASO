"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // Anti-enumeration: ignore failures and still show the generic message.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="aso-anim-fade-rise card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("forgot.title")}</h1>
        <p className="text-sm text-foreground/70">{t("forgot.subtitle")}</p>
      </div>

      {submitted ? (
        <div className="aso-anim-fade-rise card p-6 space-y-3">
          <p className="text-sm text-success bg-success/10 p-3 rounded-md">
            {t("forgot.successMessage")}
          </p>
          <Link href="/login" className="inline-block text-sm text-primary hover:text-primary-hover">
            {t("common.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="aso-anim-fade-rise card space-y-3 p-6" style={{ animationDelay: "60ms" }}>
          <input
            type="email"
            placeholder={t("common.email")}
            className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? t("forgot.submitting") : t("forgot.submit")}
          </button>
          <Link href="/login" className="block text-center text-sm text-primary hover:text-primary-hover">
            {t("common.backToLogin")}
          </Link>
        </form>
      )}
    </div>
  );
}
