"use client";

import { useState, useRef, useEffect } from "react";
import {
    sendChatMessage,
    startChatSession,
    escalateChatSession,
    type ChatSessionStatus,
} from "@/lib/api";
import { useT, useLocale } from "@/context/LocaleContext";
import { isRtl } from "@/lib/i18n.shared";

interface Message {
    id: string;
    role: "user" | "assistant" | "admin";
    content: string;
}

const SESSION_KEY = "althea.chat.sessionId";
const STATUS_KEY = "althea.chat.sessionStatus";
const SUBJECT_KEY = "althea.chat.subject";
const EMAIL_KEY = "althea.chat.email";

export function ChatWidget() {
    const [open, setOpen] = useState(false);
    const t = useT();
    const locale = useLocale();
    const rtl = isRtl(locale);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // Pre-chat form state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<ChatSessionStatus>("open");
    const [storedEmail, setStoredEmail] = useState<string>("");
    const [storedSubject, setStoredSubject] = useState<string>("");
    const [emailDraft, setEmailDraft] = useState("");
    const [subjectDraft, setSubjectDraft] = useState("");
    const [startError, setStartError] = useState<string | null>(null);
    const [startingSession, setStartingSession] = useState(false);

    // Hydrate session from localStorage on mount.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const id = localStorage.getItem(SESSION_KEY);
        const status = localStorage.getItem(STATUS_KEY) as ChatSessionStatus | null;
        const subj = localStorage.getItem(SUBJECT_KEY) ?? "";
        const mail = localStorage.getItem(EMAIL_KEY) ?? "";
        if (id) setSessionId(id);
        if (status) setSessionStatus(status);
        if (subj) setStoredSubject(subj);
        if (mail) setStoredEmail(mail);
        // Welcome bubble (persisted intro for the conversation).
        setMessages([{ id: "welcome", role: "assistant", content: t("chat.welcome") }]);
        // We intentionally hydrate once on mount; t() is stable per locale.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (startingSession) return;
        setStartError(null);
        const trimmedEmail = emailDraft.trim().toLowerCase();
        const trimmedSubject = subjectDraft.trim();
        if (!trimmedEmail || !trimmedSubject) {
            setStartError(t("chat.startError"));
            return;
        }
        setStartingSession(true);
        try {
            const res = await startChatSession(trimmedEmail, trimmedSubject);
            setSessionId(res.sessionId);
            setSessionStatus(res.status);
            setStoredEmail(trimmedEmail);
            setStoredSubject(res.subject);
            localStorage.setItem(SESSION_KEY, res.sessionId);
            localStorage.setItem(STATUS_KEY, res.status);
            localStorage.setItem(SUBJECT_KEY, res.subject);
            localStorage.setItem(EMAIL_KEY, trimmedEmail);
        } catch (err) {
            setStartError(err instanceof Error ? err.message : t("chat.genericError"));
        } finally {
            setStartingSession(false);
        }
    };

    const send = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading || !sessionId) return;

        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await sendChatMessage(sessionId, msg);
            setMessages((prev) => [
                ...prev,
                { id: res.messageId, role: "assistant", content: res.reply },
            ]);
            setSessionStatus(res.sessionStatus);
            localStorage.setItem(STATUS_KEY, res.sessionStatus);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `e-${Date.now()}`, role: "assistant", content: t("chat.error") },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const escalate = async () => {
        if (!sessionId || sessionStatus === "escalated") return;
        try {
            const res = await escalateChatSession(sessionId);
            setSessionStatus(res.status);
            localStorage.setItem(STATUS_KEY, res.status);
            setMessages((prev) => [
                ...prev,
                {
                    id: `esc-${Date.now()}`,
                    role: "assistant",
                    content: t("chat.escalationMessage"),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `e-${Date.now()}`, role: "assistant", content: t("chat.error") },
            ]);
        }
    };

    const resetSession = () => {
        setSessionId(null);
        setSessionStatus("open");
        setStoredEmail("");
        setStoredSubject("");
        setEmailDraft("");
        setSubjectDraft("");
        setMessages([{ id: "welcome", role: "assistant", content: t("chat.welcome") }]);
        if (typeof window !== "undefined") {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(STATUS_KEY);
            localStorage.removeItem(SUBJECT_KEY);
            localStorage.removeItem(EMAIL_KEY);
        }
    };

    const suggestions = [
        t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3"), t("chat.suggestion4"),
    ];
    const showSuggestions = sessionId !== null && messages.length <= 1 && !isLoading;
    const canEscalate = sessionId !== null && sessionStatus !== "escalated";

    return (
        <>
            {/* Floating button */}
            <button
                id="chat-widget-toggle"
                onClick={() => setOpen((o) => !o)}
                aria-label={t("chat.toggleAria")}
                style={{
                    position: "fixed", bottom: 24, insetInlineEnd: 24, zIndex: 50,
                    width: 56, height: 56, borderRadius: "50%", border: "none",
                    background: "var(--primary)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--foreground) 35%, transparent)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    {open
                        ? <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        : <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                    }
                </svg>
            </button>

            {/* Chat drawer */}
            {open && (
                <div
                    style={{
                        position: "fixed", bottom: 92, insetInlineEnd: 24, zIndex: 50,
                        width: 370, maxHeight: "78vh", borderRadius: 20,
                        background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                        animation: "chatSlideUp 0.25s ease-out",
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: "16px 20px", background: "var(--foreground)", color: "white" }}>
                        <p style={{ fontSize: 15, fontWeight: 700 }}>{t("chat.title")}</p>
                        <p style={{ fontSize: 11, opacity: 0.7 }}>
                            {storedSubject || t("chat.subtitle")}
                        </p>
                    </div>

                    {/* Pre-chat form */}
                    {!sessionId && (
                        <form
                            onSubmit={startSession}
                            style={{
                                padding: "16px 18px",
                                background: "var(--background)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <p style={{ fontSize: 12, color: "var(--foreground)", opacity: 0.75 }}>
                                {t("chat.preformIntro")}
                            </p>
                            <input
                                type="email"
                                required
                                placeholder={t("chat.emailPlaceholder")}
                                value={emailDraft}
                                onChange={(e) => setEmailDraft(e.target.value)}
                                disabled={startingSession}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)",
                                    fontSize: 13,
                                    background: "white",
                                    color: "var(--foreground)",
                                }}
                            />
                            <input
                                type="text"
                                required
                                maxLength={160}
                                placeholder={t("chat.subjectPlaceholder")}
                                value={subjectDraft}
                                onChange={(e) => setSubjectDraft(e.target.value)}
                                disabled={startingSession}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)",
                                    fontSize: 13,
                                    background: "white",
                                    color: "var(--foreground)",
                                }}
                            />
                            {startError && (
                                <p style={{ fontSize: 12, color: "var(--error, #c0392b)" }}>{startError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={startingSession || !emailDraft.trim() || !subjectDraft.trim()}
                                style={{
                                    padding: "9px 16px",
                                    border: "none",
                                    borderRadius: 8,
                                    background: "var(--primary)",
                                    color: "white",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor:
                                        startingSession || !emailDraft.trim() || !subjectDraft.trim()
                                            ? "default"
                                            : "pointer",
                                    opacity:
                                        startingSession || !emailDraft.trim() || !subjectDraft.trim() ? 0.6 : 1,
                                }}
                            >
                                {startingSession ? t("chat.startingSession") : t("chat.startSession")}
                            </button>
                        </form>
                    )}

                    {/* Active session UI */}
                    {sessionId && (
                        <>
                            {/* Escalated banner */}
                            {sessionStatus === "escalated" && (
                                <div
                                    role="status"
                                    style={{
                                        padding: "8px 14px",
                                        background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                                        color: "var(--primary)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderBottom: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                                    }}
                                >
                                    {t("chat.escalatedNotice", { email: storedEmail || t("chat.escalatedFallbackAddress") })}
                                </div>
                            )}

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 10, background: "var(--background)", maxHeight: 320 }}>
                                {messages.map((m) => {
                                    const isUser = m.role === "user";
                                    // Use logical border-radius corners so the speech-tail
                                    // corner sits on the writing-mode-inline-start side.
                                    return (
                                        <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                                            <div style={{
                                                maxWidth: "80%", padding: "8px 14px", fontSize: 13, lineHeight: 1.5,
                                                whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                borderStartStartRadius: 14,
                                                borderStartEndRadius: 14,
                                                borderEndEndRadius: isUser ? 4 : 14,
                                                borderEndStartRadius: isUser ? 14 : 4,
                                                background: isUser ? "var(--primary)" : "white",
                                                color: isUser ? "white" : "var(--foreground)",
                                                boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                                            }}>{m.content}</div>
                                        </div>
                                    );
                                })}
                                {isLoading && (
                                    <div style={{ display: "flex" }}>
                                        <div style={{
                                            padding: "8px 18px",
                                            borderStartStartRadius: 14, borderStartEndRadius: 14,
                                            borderEndEndRadius: 14, borderEndStartRadius: 4,
                                            background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                            display: "flex", gap: 4, alignItems: "center",
                                        }}>
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
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 14px", background: "var(--background)" }}>
                                    {suggestions.map((s) => (
                                        <button key={s} onClick={() => send(s)} style={{
                                            padding: "4px 10px", borderRadius: 16, border: "1px solid var(--background)", background: "white",
                                            color: "var(--primary)", fontSize: 11, fontWeight: 500, cursor: "pointer",
                                        }}>{s}</button>
                                    ))}
                                </div>
                            )}

                            {/* Action row: human escalation + reset */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    padding: "6px 14px",
                                    background: "var(--background)",
                                    borderTop: "1px solid color-mix(in srgb, var(--foreground) 6%, transparent)",
                                }}
                            >
                                {canEscalate && (
                                    <button
                                        type="button"
                                        onClick={escalate}
                                        title={t("chat.askHuman")}
                                        style={{
                                            padding: "5px 10px",
                                            borderRadius: 14,
                                            border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
                                            background: "white",
                                            color: "var(--primary)",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {t("chat.talkToHuman")}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={resetSession}
                                    title={t("chat.newConversation")}
                                    style={{
                                        marginInlineStart: "auto",
                                        padding: "5px 10px",
                                        borderRadius: 14,
                                        border: "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)",
                                        background: "white",
                                        color: "var(--foreground)",
                                        fontSize: 11,
                                        opacity: 0.75,
                                        cursor: "pointer",
                                    }}
                                >
                                    {t("chat.newConversation")}
                                </button>
                            </div>

                            {/* Input */}
                            <div style={{ padding: "10px 14px", borderTop: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)", background: "white", display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                    id="chat-widget-input"
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && send()}
                                    placeholder={t("chat.placeholder")}
                                    disabled={isLoading || sessionStatus === "escalated"}
                                    style={{ flex: 1, padding: "8px 14px", borderRadius: 20, border: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)", outline: "none", fontSize: 13, color: "var(--foreground)", background: "var(--background)" }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = "color-mix(in srgb, var(--foreground) 10%, transparent)")}
                                />
                                <button
                                    id="chat-widget-send"
                                    onClick={() => send()}
                                    disabled={!input.trim() || isLoading || sessionStatus === "escalated"}
                                    style={{
                                        width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                                        background: input.trim() && !isLoading && sessionStatus !== "escalated" ? "var(--primary)" : "color-mix(in srgb, var(--foreground) 10%, transparent)",
                                        cursor: input.trim() && !isLoading && sessionStatus !== "escalated" ? "pointer" : "default",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    {/* Paper-plane points along the inline-end direction; flip in RTL. */}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
        .chat-dot { width:7px;height:7px;border-radius:50%;background:var(--primary);animation:chatBounce .6s infinite alternate; }
        @keyframes chatBounce { from{opacity:.3;transform:translateY(0)} to{opacity:1;transform:translateY(-4px)} }
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </>
    );
}
