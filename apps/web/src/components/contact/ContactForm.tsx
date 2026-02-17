"use client";
import React, { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Remplace VOTRE_ID par ton ID Formspree
    const response = await fetch("https://formspree.io/f/VOTRE_ID", {
      method: "POST",
      body: data,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      setStatus("SUCCESS");
      form.reset();
    } else {
      setStatus("ERROR");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-6">
      <input
        name="name"
        required
        placeholder="Nom"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="Email"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <input
        name="subject"
        required
        placeholder="Sujet"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <textarea
        name="message"
        required
        placeholder="Votre demande"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={4}
      />
      <button 
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
      >
        Envoyer le message
      </button>

      {status === "SUCCESS" && (
        <p className="text-sm text-green-600 font-medium text-center">✅ Message envoyé avec succès !</p>
      )}
      {status === "ERROR" && (
        <p className="text-sm text-red-600 font-medium text-center">❌ Erreur lors de l'envoi.</p>
      )}
    </form>
  );
}