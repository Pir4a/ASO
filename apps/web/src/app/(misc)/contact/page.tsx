"use client";

import { useState, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Contact request failed");
      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Contact & Chatbot</h1>
        <p className="text-sm text-slate-600">
          Formulaire de contact et chatbot (intégration API à venir).
        </p>
      </div>
      <form className="card space-y-3 p-6" onSubmit={handleSubmit}>
        <input
          required
          name="name"
          placeholder="Nom"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          type="email"
          required
          name="email"
          placeholder="Email"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <textarea
          required
          name="message"
          placeholder="Votre demande"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          rows={4}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
        >
          {status === "loading" ? "Envoi en cours..." : "Envoyer"}
        </button>
        {status === "success" && (
          <p className="text-sm text-emerald-600">Votre message a bien ete envoye.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-rose-600">Une erreur est survenue. Reessayez.</p>
        )}
      </form>
      <div className="card p-4">
        <p className="text-sm text-slate-600">
          Le chatbot sera connecté à l&apos;API outils côté backoffice (canal support).
        </p>
      </div>
    </div>
  );
}

