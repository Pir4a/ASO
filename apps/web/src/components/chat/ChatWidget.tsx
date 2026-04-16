"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

const SUGGESTIONS = [
    "What products do you sell?",
    "How does shipping work?",
    "What's your return policy?",
    "How do I track my order?",
];

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hi! 👋 I'm the Althea Systems assistant. Ask me anything about our products, orders, or shipping!",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: msg,
        };
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
                { id: `bot-${Date.now()}`, role: "assistant", content: reply },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content:
                        "Sorry, I'm having trouble connecting. Please try again or reach out via our contact form.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const showSuggestions = messages.length <= 1 && !isLoading;

    return (
        <>
            {/* Floating Bubble */}
            <button
                id="chat-widget-toggle"
                onClick={() => setIsOpen((o) => !o)}
                aria-label={isOpen ? "Close chat" : "Open chat"}
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00a8b5, #003d5c)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(0,61,92,0.35)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.08)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,61,92,0.45)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,61,92,0.35)";
                }}
            >
                {isOpen ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" /><circle cx="8" cy="10" r="1" /><circle cx="12" cy="10" r="1" /><circle cx="16" cy="10" r="1" /></svg>
                )}
            </button>

            {/* Chat Drawer */}
            {isOpen && (
                <div
                    id="chat-widget-drawer"
                    style={{
                        position: "fixed",
                        bottom: 96,
                        right: 24,
                        zIndex: 9998,
                        width: 380,
                        maxWidth: "calc(100vw - 32px)",
                        height: 520,
                        maxHeight: "calc(100vh - 140px)",
                        borderRadius: 20,
                        background: "#ffffff",
                        boxShadow: "0 20px 60px rgba(0,61,92,0.2), 0 0 0 1px rgba(0,168,181,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: "chatSlideUp 0.3s cubic-bezier(.21,1.02,.73,1)",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, #00a8b5, #003d5c)",
                            padding: "18px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l4.93-1.38C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm2.07-5.75l-.9.92C11.45 11.9 11 12.5 11 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H6c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                        </div>
                        <div>
                            <div style={{ color: "white", fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
                                Althea Assistant
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                                Powered by Llama AI
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "16px 16px 8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            background: "#f8fafb",
                        }}
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                style={{
                                    display: "flex",
                                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: "80%",
                                        padding: "10px 14px",
                                        borderRadius:
                                            msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                        background:
                                            msg.role === "user"
                                                ? "linear-gradient(135deg, #00a8b5, #33bfc9)"
                                                : "white",
                                        color: msg.role === "user" ? "white" : "#1f2937",
                                        fontSize: 14,
                                        lineHeight: 1.5,
                                        boxShadow:
                                            msg.role === "user"
                                                ? "none"
                                                : "0 1px 4px rgba(0,0,0,0.06)",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: "16px 16px 16px 4px",
                                        background: "white",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                        display: "flex",
                                        gap: 5,
                                        alignItems: "center",
                                    }}
                                >
                                    <span className="chat-dot" style={{ animationDelay: "0s" }} />
                                    <span className="chat-dot" style={{ animationDelay: "0.15s" }} />
                                    <span className="chat-dot" style={{ animationDelay: "0.3s" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {showSuggestions && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                padding: "8px 16px",
                                background: "#f8fafb",
                            }}
                        >
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 20,
                                        border: "1px solid #d4f4f7",
                                        background: "white",
                                        color: "#00a8b5",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#d4f4f7";
                                        e.currentTarget.style.borderColor = "#00a8b5";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "white";
                                        e.currentTarget.style.borderColor = "#d4f4f7";
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderTop: "1px solid #e5e7eb",
                            background: "white",
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                        }}
                    >
                        <input
                            ref={inputRef}
                            id="chat-widget-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: 24,
                                border: "1.5px solid #e5e7eb",
                                outline: "none",
                                fontSize: 14,
                                color: "#1f2937",
                                background: "#f9fafb",
                                transition: "border-color 0.15s",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#00a8b5")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                        />
                        <button
                            id="chat-widget-send"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                border: "none",
                                background:
                                    input.trim() && !isLoading
                                        ? "linear-gradient(135deg, #00a8b5, #003d5c)"
                                        : "#e5e7eb",
                                cursor: input.trim() && !isLoading ? "pointer" : "default",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "background 0.15s, transform 0.1s",
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Global keyframe styles */}
            <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00a8b5;
          animation: chatBounce 0.6s infinite alternate;
        }
        @keyframes chatBounce {
          from { opacity: 0.3; transform: translateY(0); }
          to   { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
        </>
    );
}
