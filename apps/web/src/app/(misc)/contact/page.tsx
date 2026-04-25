"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";
import { useT } from "@/context/LocaleContext";
import { CategoryHero } from "@/components/category/CategoryHero";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ContactPage() {
  const t = useT();
  const [tab, setTab] = useState<"chat" | "form">("chat");

  return (
    <div className="space-y-7">
      {/* Breadcrumb */}
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">Contact</span>
      </nav>

      {/* Hero */}
      <CategoryHero
        eyebrow="Support"
        name={t("contact.title")}
        description={t("contact.subtitle")}
        stats={[
          { value: "< 2 h", label: "Réponse moyenne" },
          { value: "24/7", label: "Assistant IA" },
          { value: "FR", label: "Support local" },
        ]}
      />

      {/* Main: tabs + sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* Tab toggle */}
          <div
            role="tablist"
            aria-label="Choisir un mode de contact"
            className="inline-flex rounded-xl border border-foreground/10 bg-white p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              id="tab-chat"
              aria-selected={tab === "chat"}
              aria-controls="panel-chat"
              onClick={() => setTab("chat")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
                tab === "chat"
                  ? "bg-foreground text-white shadow-sm"
                  : "text-foreground/70 hover:bg-background/60 hover:text-foreground"
              }`}
              style={tab === "chat" ? { color: "#fff" } : undefined}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
                <path d="M2.5 3.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5V11.5H2.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
              </svg>
              Chat IA
            </button>
            <button
              type="button"
              role="tab"
              id="tab-form"
              aria-selected={tab === "form"}
              aria-controls="panel-form"
              onClick={() => setTab("form")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
                tab === "form"
                  ? "bg-foreground text-white shadow-sm"
                  : "text-foreground/70 hover:bg-background/60 hover:text-foreground"
              }`}
              style={tab === "form" ? { color: "#fff" } : undefined}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
                <rect x="2" y="3.5" width="12" height="9" rx="1" />
                <path d="m2.5 4.5 5.5 4 5.5-4" />
              </svg>
              Formulaire
            </button>
          </div>

          {tab === "chat" ? <ChatPanel /> : <ContactForm />}
        </div>

        {/* Info sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-44 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
            <header className="border-b border-foreground/5 px-5 py-4">
              <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                Contact direct
              </p>
              <h2 className="font-heading text-[18px] font-semibold tracking-tight text-foreground">
                Joindre l&apos;équipe Althea
              </h2>
            </header>
            <ul className="divide-y divide-foreground/5" role="list">
              <ContactRow
                href="mailto:contact@althea.fr"
                label="Email"
                value="contact@althea.fr"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                }
              />
              <ContactRow
                href="tel:+33184801200"
                label="Téléphone"
                value="+33 1 84 80 12 00"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              <ContactRow
                label="Adresse"
                value="12 rue de la Santé, 75013 Paris"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5">
                    <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                }
              />
              <ContactRow
                label="Horaires"
                value="Lun – Ven · 9 h – 18 h"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                }
              />
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border-l-4 border-primary border-y border-r border-foreground/10 bg-white px-5 py-4">
            <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
              Garanties
            </p>
            <p className="text-[13.5px] leading-relaxed text-foreground/75">
              Tous nos équipements sont certifiés CE médical, conformes ISO 13485, et accompagnés
              d&apos;une garantie constructeur avec maintenance assurée par nos techniciens.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-background text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-foreground/55">
          {label}
        </p>
        <p className="mt-0.5 truncate font-medium text-foreground">{value}</p>
      </div>
      {href && (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 text-foreground/30">
          <path d="M3 8h10m-3-3 3 3-3 3" />
        </svg>
      )}
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-background/50"
        >
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3.5">{inner}</div>
      )}
    </li>
  );
}

/* ── Chat Panel ───────────────────────────────────────────────── */

function ChatPanel() {
  const t = useT();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "welcome", role: "assistant", content: t("contact.chatWelcome") },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, role: "user", content: msg }]);
    setInput("");
    setIsLoading(true);
    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await sendChatMessage(msg, history);
      setMessages((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: `e-${Date.now()}`, role: "assistant", content: t("contact.chatError") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    t("chat.suggestion1"),
    t("chat.suggestion2"),
    t("chat.suggestion3"),
    t("chat.suggestion4"),
  ];
  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <section
      id="panel-chat"
      role="tabpanel"
      aria-labelledby="tab-chat"
      className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white"
    >
      <header className="flex items-center gap-3 border-b border-foreground/5 px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-4 w-4">
            <path d="M21 12a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.5A8.5 8.5 0 1 1 21 12z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-heading text-[14.5px] font-semibold leading-tight text-foreground">
            Assistant Althea
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11.5px] text-foreground/55">
            <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
            En ligne · Réponses instantanées
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-background/40 px-4 py-5 sm:px-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap break-words px-4 py-2.5 text-[14px] leading-[1.55] ${
                m.role === "user"
                  ? "rounded-[16px_16px_4px_16px] bg-primary"
                  : "rounded-[16px_16px_16px_4px] border border-foreground/5 bg-white text-foreground shadow-sm"
              }`}
              style={m.role === "user" ? { color: "#fff" } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex">
            <div className="flex items-center gap-1.5 rounded-[16px_16px_16px_4px] border border-foreground/5 bg-white px-4 py-3 shadow-sm">
              <span className="chat-dot" style={{ animationDelay: "0s" }} />
              <span className="chat-dot" style={{ animationDelay: "0.15s" }} />
              <span className="chat-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {showSuggestions && (
        <div className="flex flex-wrap gap-2 border-t border-foreground/5 bg-white px-5 py-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-foreground/10 bg-background/40 px-3.5 py-1.5 text-[12px] font-semibold text-foreground/75 transition hover:border-primary-hover hover:bg-primary/10 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-foreground/5 bg-white px-4 py-3 sm:px-5">
        <input
          id="contact-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("contact.chatPlaceholder")}
          disabled={isLoading}
          className="min-w-0 flex-1 rounded-full border border-foreground/10 bg-background/60 px-4 py-2.5 text-[14px] text-foreground placeholder:text-foreground/55 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        />
        <button
          id="contact-chat-send"
          type="button"
          onClick={() => send()}
          disabled={!input.trim() || isLoading}
          aria-label="Envoyer le message"
          style={input.trim() && !isLoading ? { color: "#fff" } : undefined}
          className={`grid h-11 w-11 flex-none place-items-center rounded-full transition ${
            input.trim() && !isLoading
              ? "bg-primary hover:bg-primary-hover"
              : "cursor-not-allowed bg-foreground/10 text-foreground/40"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        :global(.chat-dot) {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
          animation: chatBounce 0.6s infinite alternate;
        }
        @keyframes chatBounce {
          from { opacity: 0.3; transform: translateY(0); }
          to { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </section>
  );
}

/* ── Contact Form ─────────────────────────────────────────────── */

function ContactForm() {
  const t = useT();
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

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
      if (!res.ok) throw new Error("Impossible d'envoyer votre message.");
      setSubject("");
      setEmail("");
      setMessage("");
      setFeedback({ kind: "success", text: t("contact.formSuccess") });
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "Erreur inattendue.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-4 py-2.5 text-[14px] text-foreground placeholder:text-foreground/55 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  const labelCls =
    "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/65";

  return (
    <form
      id="panel-form"
      role="tabpanel"
      aria-labelledby="tab-form"
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-foreground/10 bg-white p-6"
    >
      <div>
        <label htmlFor="contact-subject" className={labelCls}>
          {t("contact.formSubject")}
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          minLength={3}
          maxLength={120}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Demande d'information"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelCls}>
          {t("contact.formEmail")}
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelCls}>
          {t("contact.formMessage")}
        </label>
        <textarea
          id="contact-message"
          required
          minLength={10}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Détaillez votre demande…"
          rows={6}
          className={`${inputCls} resize-y`}
        />
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13.5px] ${
            feedback.kind === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {feedback.kind === "success" ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
              <path d="m3 8 3.5 3.5L13 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
              <circle cx="8" cy="8" r="6" />
              <path d="m4.5 4.5 7 7" />
            </svg>
          )}
          {feedback.text}
        </div>
      )}

      <button
        id="contact-submit"
        type="submit"
        disabled={loading}
        style={{ color: "#fff" }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t("contact.formSending")}
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            {t("contact.formSend")}
          </>
        )}
      </button>
    </form>
  );
}
