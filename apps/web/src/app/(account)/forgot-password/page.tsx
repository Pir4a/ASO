"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
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
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Mot de passe oublié</h1>
        <p className="text-sm text-foreground/70">
          Entrez votre adresse email. Si un compte correspond, vous recevrez un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      {submitted ? (
        <div className="card p-6 space-y-3">
          <p className="text-sm text-success bg-success/10 p-3 rounded-md">
            Si un compte est associé à cette adresse, un email de réinitialisation vient d&apos;être
            envoyé. Vérifiez votre boîte de réception.
          </p>
          <Link href="/login" className="inline-block text-sm text-primary hover:text-primary-hover">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-3 p-6">
          <input
            type="email"
            placeholder="Email"
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
            {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
          </button>
          <Link href="/login" className="block text-center text-sm text-primary hover:text-primary-hover">
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
