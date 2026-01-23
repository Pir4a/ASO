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
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    // Basic client-side validation
    if (!payload.name || !payload.email || !payload.message) {
      setStatus("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setStatus("error");
      return;
    }

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
        <h1 className="text-2xl font-semibold text-slate-900">Contactez-nous</h1>
        <p className="text-sm text-slate-600">
          Vous avez une question ? Besoin d'assistance ? Notre équipe vous répondra dans les plus brefs délais.
        </p>
      </div>

      <form className="card space-y-4 p-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Nom complet *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Votre nom"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="votre@email.com"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
            Sujet
          </label>
          <select
            id="subject"
            name="subject"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value="">Sélectionnez un sujet (optionnel)</option>
            <option value="Demande de devis">Demande de devis</option>
            <option value="Support technique">Support technique</option>
            <option value="Informations produit">Informations produit</option>
            <option value="Commande">Suivi de commande</option>
            <option value="Partenariat">Partenariat / Distribution</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            placeholder="Décrivez votre demande en détail..."
            rows={6}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            id="privacy"
            required
            className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor="privacy" className="leading-relaxed">
            J'accepte que mes données soient utilisées pour traiter ma demande selon notre{" "}
            <a href="/privacy" className="text-primary hover:underline">politique de confidentialité</a>.
          </label>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
        </button>

        {status === "success" && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-800">
                  Message envoyé avec succès !
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Nous avons reçu votre message et vous répondrons dans les plus brefs délais.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Une erreur est survenue
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Veuillez vérifier vos informations et réessayer.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
      <div className="card p-4">
        <p className="text-sm text-slate-600">
          💬 <strong>Chatbot intelligent disponible !</strong> Cliquez sur l'icône en bas à droite pour discuter avec notre assistant virtuel.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Il peut répondre à vos questions sur nos produits, vous aider à suivre vos commandes, et vous mettre en contact avec un conseiller humain si nécessaire.
        </p>
      </div>
    </div>
  );
}

