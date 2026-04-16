"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function ChatWidget() {
    const [open, setOpen] = useState(false);
    const t = useT();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // Initialize welcome message only once
    useEffect(() => {
        setMessages([{ id: "welcome", role: "assistant", content: t("chat.welcome") }]);
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const history = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({ role: m.role, content: m.content }));

            const { reply } = await sendChatMessage(msg, history);
            setMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, role: "assistant", content: reply },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `e-${Date.now()}`, role: "assistant", content: t("chat.error") },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3"), t("chat.suggestion4"),
    ];
    const showSuggestions = messages.length <= 1 && !isLoading;

    return (
        <>
            {/* Floating button */}
            <button
                id="chat-widget-toggle"
                onClick={() => setOpen((o) => !o)}
                aria-label="Chat"
                style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 50,
                    width: 56, height: 56, borderRadius: "50%", border: "none",
                    background: "linear-gradient(135deg,#00a8b5,#003d5c)",
                    boxShadow: "0 4px 14px rgba(0,61,92,0.35)",
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
                        position: "fixed", bottom: 92, right: 24, zIndex: 50,
                        width: 370, maxHeight: "70vh", borderRadius: 20,
                        background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                        animation: "chatSlideUp 0.25s ease-out",
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#00a8b5,#003d5c)", color: "white" }}>
                        <p style={{ fontSize: 15, fontWeight: 700 }}>{t("chat.title")}</p>
                        <p style={{ fontSize: 11, opacity: 0.7 }}>{t("chat.subtitle")}</p>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 10, background: "#f8fafb", maxHeight: 320 }}>
                        {messages.map((m) => (
                            <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "80%", padding: "8px 14px", fontSize: 13, lineHeight: 1.5,
                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                    background: m.role === "user" ? "linear-gradient(135deg,#00a8b5,#33bfc9)" : "white",
                                    color: m.role === "user" ? "white" : "#1f2937",
                                    boxShadow: m.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                                }}>{m.content}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: "flex" }}>
                                <div style={{ padding: "8px 18px", borderRadius: "14px 14px 14px 4px", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 4, alignItems: "center" }}>
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
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 14px", background: "#f8fafb" }}>
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => send(s)} style={{
                                    padding: "4px 10px", borderRadius: 16, border: "1px solid #d4f4f7", background: "white",
                                    color: "#00a8b5", fontSize: 11, fontWeight: 500, cursor: "pointer",
                                }}>{s}</button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                            id="chat-widget-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            placeholder={t("chat.placeholder")}
                            disabled={isLoading}
                            style={{ flex: 1, padding: "8px 14px", borderRadius: 20, border: "1px solid #e5e7eb", outline: "none", fontSize: 13, color: "#1f2937", background: "#f9fafb" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#00a8b5")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                        />
                        <button
                            id="chat-widget-send"
                            onClick={() => send()}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                                background: input.trim() && !isLoading ? "linear-gradient(135deg,#00a8b5,#003d5c)" : "#e5e7eb",
                                cursor: input.trim() && !isLoading ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        .chat-dot { width:7px;height:7px;border-radius:50%;background:#00a8b5;animation:chatBounce .6s infinite alternate; }
        @keyframes chatBounce { from{opacity:.3;transform:translateY(0)} to{opacity:1;transform:translateY(-4px)} }
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </>
    );
}
