"use client";

import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, email, message }),
      });

      if (!res.ok) {
        throw new Error("Impossible d'envoyer votre message.");
      }

      setSubject("");
      setEmail("");
      setMessage("");
      setFeedback("Message envoyé. Le support vous répondra rapidement.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Contact & Chatbot</h1>
        <p className="text-sm text-slate-600">
          Formulaire de contact relié à l&apos;API support.
        </p>
      </div>
      <form className="card space-y-3 p-6" onSubmit={onSubmit}>
        <input
          required
          minLength={3}
          maxLength={120}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Sujet"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <textarea
          required
          minLength={10}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          rows={5}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-70"
        >
          {loading ? "Envoi..." : "Envoyer"}
        </button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </form>
      <div className="card p-4">
        <p className="text-sm text-slate-600">
          Le chatbot reste à connecter (FAQ, escalade humain, contexte commande).
        </p>
      </div>
    </div>
  );
}

