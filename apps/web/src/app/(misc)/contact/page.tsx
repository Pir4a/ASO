"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/* ── Chat types ───────────────────────────────────────────────── */
interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ContactPage() {
  const [tab, setTab] = useState<"chat" | "form">("chat");
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div
        style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, #00a8b5, #003d5c)",
          padding: "28px 32px",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
          {t("contact.title")}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.75, margin: "6px 0 0" }}>
          {t("contact.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <button
          id="tab-chat"
          onClick={() => setTab("chat")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, transition: "all 0.2s",
            background: tab === "chat" ? "linear-gradient(135deg, #00a8b5, #33bfc9)" : "transparent",
            color: tab === "chat" ? "white" : "#64748b",
          }}
        >
          {t("contact.tabChat")}
        </button>
        <button
          id="tab-form"
          onClick={() => setTab("form")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, transition: "all 0.2s",
            background: tab === "form" ? "linear-gradient(135deg, #00a8b5, #33bfc9)" : "transparent",
            color: tab === "form" ? "white" : "#64748b",
          }}
        >
          {t("contact.tabForm")}
        </button>
      </div>

      {/* Content */}
      {tab === "chat" ? <ChatPanel /> : <ContactForm />}
    </div>
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, role: "user", content: msg }]);
    setInput("");
    setIsLoading(true);
    try {
      const history = messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await sendChatMessage(msg, history);
      setMessages((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", content: reply }]);
    } catch {
      setMessages((p) => [...p, { id: `e-${Date.now()}`, role: "assistant", content: t("contact.chatError") }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3"), t("chat.suggestion4"),
  ];
  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div className="card" style={{ borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 420 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 12, background: "#f8fafb" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "78%", padding: "10px 16px", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "linear-gradient(135deg,#00a8b5,#33bfc9)" : "white",
              color: m.role === "user" ? "white" : "#1f2937",
              boxShadow: m.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
            }}>{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "10px 20px", borderRadius: "16px 16px 16px 4px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 5, alignItems: "center" }}>
              <span className="chat-dot" style={{ animationDelay: "0s" }} />
              <span className="chat-dot" style={{ animationDelay: "0.15s" }} />
              <span className="chat-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 20px", background: "#f8fafb" }}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid #d4f4f7", background: "white",
              color: "#00a8b5", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4f4f7"; e.currentTarget.style.borderColor = "#00a8b5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#d4f4f7"; }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: 10, alignItems: "center" }}>
        <input
          id="contact-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("contact.chatPlaceholder")}
          disabled={isLoading}
          style={{ flex: 1, padding: "10px 18px", borderRadius: 24, border: "1.5px solid #e5e7eb", outline: "none", fontSize: 14, color: "#1f2937", background: "#f9fafb", transition: "border-color 0.15s" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#00a8b5")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
        <button
          id="contact-chat-send"
          onClick={() => send()}
          disabled={!input.trim() || isLoading}
          style={{
            width: 42, height: 42, borderRadius: "50%", border: "none", flexShrink: 0,
            background: input.trim() && !isLoading ? "linear-gradient(135deg,#00a8b5,#003d5c)" : "#e5e7eb",
            cursor: input.trim() && !isLoading ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </div>

      <style>{`
        .chat-dot { width:8px;height:8px;border-radius:50%;background:#00a8b5;animation:chatBounce .6s infinite alternate; }
        @keyframes chatBounce { from{opacity:.3;transform:translateY(0)} to{opacity:1;transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}

/* ── Contact Form ─────────────────────────────────────────────── */
function ContactForm() {
  const t = useT();
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
      if (!res.ok) throw new Error("Unable to send your message.");
      setSubject("");
      setEmail("");
      setMessage("");
      setFeedback(t("contact.formSuccess"));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card space-y-4 p-6" style={{ borderRadius: 20 }} onSubmit={onSubmit}>
      <input
        id="contact-subject" required minLength={3} maxLength={120}
        value={subject} onChange={(e) => setSubject(e.target.value)}
        placeholder={t("contact.formSubject")}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <input
        id="contact-email" type="email" required
        value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder={t("contact.formEmail")}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <textarea
        id="contact-message" required minLength={10} maxLength={2000}
        value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder={t("contact.formMessage")}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={5}
      />
      <button
        id="contact-submit" type="submit" disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-70"
      >
        {loading ? t("contact.formSending") : t("contact.formSend")}
      </button>
      {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
    </form>
  );
}
