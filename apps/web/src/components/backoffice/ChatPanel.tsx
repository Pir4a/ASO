"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { Panel, Icon } from "@/components/backoffice/DashboardUI";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type SessionStatus = "open" | "closed" | "escalated";

type SessionRow = {
    id: string;
    userId: string | null;
    guestEmail: string | null;
    subject: string;
    status: SessionStatus;
    escalatedAt: string | null;
    lastActivityAt: string;
    createdAt: string;
};

type SessionMessage = {
    id: string;
    role: "user" | "assistant" | "admin";
    content: string;
    createdAt: string;
};

type SessionDetail = SessionRow & { messages: SessionMessage[] };

const STATUS_LABELS: Record<SessionStatus, string> = {
    open: "Ouvert",
    closed: "Clos",
    escalated: "Escaladé",
};

const ROLE_LABELS: Record<SessionMessage["role"], string> = {
    user: "Client",
    assistant: "Bot",
    admin: "Admin",
};

const formatDate = (iso: string) => new Date(iso).toLocaleString("fr-FR");

export function ChatPanel({
    flash,
}: {
    flash?: (kind: "success" | "error", text: string) => void;
}) {
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<"" | SessionStatus>("");
    const [escalatedOnly, setEscalatedOnly] = useState(false);
    const [loading, setLoading] = useState(false);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [detail, setDetail] = useState<SessionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (statusFilter) sp.set("status", statusFilter);
            if (escalatedOnly) sp.set("escalated", "true");
            const res = await authFetch(`${API_URL}/admin/chat/sessions?${sp.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const body = (await res.json()) as { data: SessionRow[]; meta: { total: number } };
            setSessions(body.data);
            setTotal(body.meta.total);
        } catch (e) {
            flash?.("error", `Impossible de charger les sessions: ${(e as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, statusFilter, escalatedOnly, flash]);

    useEffect(() => {
        void load();
    }, [load]);

    const openDetail = async (id: string) => {
        setActiveId(id);
        setDetail(null);
        setDetailLoading(true);
        setReply("");
        try {
            const res = await authFetch(`${API_URL}/admin/chat/sessions/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setDetail((await res.json()) as SessionDetail);
        } catch (e) {
            flash?.("error", `Impossible de charger la session: ${(e as Error).message}`);
            setActiveId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const sendReply = async () => {
        if (!activeId || !reply.trim()) return;
        setSending(true);
        try {
            const res = await authFetch(`${API_URL}/admin/chat/sessions/${activeId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: reply.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `HTTP ${res.status}`);
            }
            const data = (await res.json()) as { emailSentTo: string };
            flash?.("success", `Réponse envoyée à ${data.emailSentTo}`);
            setReply("");
            await openDetail(activeId);
            await load();
        } catch (e) {
            flash?.("error", `Envoi impossible: ${(e as Error).message}`);
        } finally {
            setSending(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Panel title="Chat support" subtitle={`${total} session${total > 1 ? "s" : ""}`}>
            <div className="bo-toolbar" style={{ marginBottom: 12, gap: 8 }}>
                <select
                    className="bo-select"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as "" | SessionStatus);
                        setPage(1);
                    }}
                >
                    <option value="">Tous statuts</option>
                    <option value="open">Ouvert</option>
                    <option value="escalated">Escaladé</option>
                    <option value="closed">Clos</option>
                </select>
                <label
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "var(--foreground)",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={escalatedOnly}
                        onChange={(e) => {
                            setEscalatedOnly(e.target.checked);
                            setPage(1);
                        }}
                    />
                    Escaladés uniquement
                </label>
                <button className="bo-btn" type="button" onClick={() => void load()} disabled={loading}>
                    <Icon.Refresh /> {loading ? "Chargement…" : "Rafraîchir"}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: detail || activeId ? "1fr 1fr" : "1fr", gap: 16 }}>
                {/* Left: sessions list */}
                <div className="bo-table-wrap">
                    <table className="bo-table">
                        <thead>
                            <tr>
                                <th>Sujet</th>
                                <th>Email</th>
                                <th>Statut</th>
                                <th>Dernière activité</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length === 0 && !loading ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="bo-muted"
                                        style={{ textAlign: "center", padding: 24 }}
                                    >
                                        Aucune session
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => void openDetail(s.id)}
                                        style={{
                                            cursor: "pointer",
                                            background: s.id === activeId ? "color-mix(in srgb, var(--primary) 8%, transparent)" : undefined,
                                        }}
                                    >
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{s.subject}</span>
                                        </td>
                                        <td>{s.guestEmail ?? <span className="bo-muted">—</span>}</td>
                                        <td>
                                            {s.status === "escalated" ? (
                                                <span className="bo-badge danger">Escaladé</span>
                                            ) : s.status === "closed" ? (
                                                <span className="bo-badge">Clos</span>
                                            ) : (
                                                <span className="bo-badge ok">Ouvert</span>
                                            )}
                                        </td>
                                        <td className="bo-muted">{formatDate(s.lastActivityAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="bo-pagination" style={{ marginTop: 12 }}>
                        <button
                            className="bo-btn"
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Précédent
                        </button>
                        <span className="bo-muted" style={{ margin: "0 12px" }}>
                            Page {page} / {totalPages}
                        </span>
                        <button
                            className="bo-btn"
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Suivant
                        </button>
                    </div>
                </div>

                {/* Right: session detail + reply */}
                {(detail || detailLoading) && (
                    <div
                        style={{
                            border: "1px solid color-mix(in srgb, var(--foreground) 8%, transparent)",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            minHeight: 360,
                            background: "white",
                        }}
                    >
                        {detailLoading ? (
                            <p className="bo-muted">Chargement…</p>
                        ) : detail ? (
                            <>
                                <div>
                                    <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Sujet</p>
                                    <p style={{ fontSize: 15, fontWeight: 700, margin: "2px 0 0" }}>
                                        {detail.subject}
                                    </p>
                                    <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>
                                        {detail.guestEmail ?? "(client connecté)"} ·{" "}
                                        {STATUS_LABELS[detail.status]} · démarré{" "}
                                        {formatDate(detail.createdAt)}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        maxHeight: 320,
                                        overflowY: "auto",
                                        padding: "8px 0",
                                        borderTop: "1px solid color-mix(in srgb, var(--foreground) 6%, transparent)",
                                        borderBottom: "1px solid color-mix(in srgb, var(--foreground) 6%, transparent)",
                                    }}
                                >
                                    {detail.messages.map((m) => (
                                        <div
                                            key={m.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: m.role === "user" ? "flex-start" : "flex-end",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    maxWidth: "82%",
                                                    padding: "8px 12px",
                                                    fontSize: 13,
                                                    borderRadius: 12,
                                                    background:
                                                        m.role === "user"
                                                            ? "var(--background)"
                                                            : m.role === "admin"
                                                                ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                                                                : "white",
                                                    color:
                                                        m.role === "admin" ? "var(--primary)" : "var(--foreground)",
                                                    border: "1px solid color-mix(in srgb, var(--foreground) 8%, transparent)",
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        margin: 0,
                                                        opacity: 0.65,
                                                    }}
                                                >
                                                    {ROLE_LABELS[m.role]} · {formatDate(m.createdAt)}
                                                </p>
                                                <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                                                    {m.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        rows={4}
                                        placeholder="Réponse envoyée par e-mail au client…"
                                        disabled={sending}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: 8,
                                            border: "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)",
                                            fontSize: 13,
                                            color: "var(--foreground)",
                                            background: "white",
                                            resize: "vertical",
                                        }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <button
                                            type="button"
                                            className="bo-btn primary"
                                            onClick={() => void sendReply()}
                                            disabled={sending || !reply.trim()}
                                        >
                                            {sending ? "Envoi…" : "Répondre par e-mail"}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </Panel>
    );
}
