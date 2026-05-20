"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { Panel, Icon } from "@/components/backoffice/DashboardUI";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type AdminCreditNote = {
    id: string;
    number: string;
    invoiceId: string;
    invoiceNumber: string | null;
    userId: string | null;
    customerEmail: string | null;
    amountTtcCents: number;
    currency: string;
    reason: "cancellation" | "refund" | "error";
    issuedAt: string;
    pdfUrl: string | null;
};

type ListResponse = {
    page: number;
    pageSize: number;
    total: number;
    creditNotes: AdminCreditNote[];
};

const REASON_LABELS: Record<AdminCreditNote["reason"], string> = {
    cancellation: "Annulation",
    refund: "Remboursement",
    error: "Correction",
};

// Credit notes are always rendered with a negative sign, regardless of how the
// underlying amount is stored (newer rows use negative cents, older ones may
// be positive). We force `-|amount|` so the BO and CDC stay consistent.
const formatNegativeMoney = (cents: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
    }).format(-Math.abs(cents) / 100);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export function CreditNotesPanel({ flash }: { flash?: (kind: "success" | "error", text: string) => void }) {
    const [creditNotes, setCreditNotes] = useState<AdminCreditNote[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [reasonFilter, setReasonFilter] = useState<"" | AdminCreditNote["reason"]>("");
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (reasonFilter) sp.set("reason", reasonFilter);
            const res = await authFetch(`${API_URL}/admin/credit-notes?${sp.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: ListResponse = await res.json();
            setCreditNotes(data.creditNotes);
            setTotal(data.total);
        } catch (e) {
            flash?.("error", `Impossible de charger les avoirs: ${(e as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, reasonFilter, flash]);

    useEffect(() => {
        void load();
    }, [load]);

    const downloadPdf = async (cn: AdminCreditNote) => {
        setBusyId(cn.id);
        try {
            const res = await authFetch(`${API_URL}/admin/credit-notes/${cn.id}/pdf`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${cn.number}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            flash?.("error", `Téléchargement impossible: ${(e as Error).message}`);
        } finally {
            setBusyId(null);
        }
    };

    const focusInvoice = (cn: AdminCreditNote) => {
        if (!cn.invoiceNumber) return;
        const escaped = cn.invoiceNumber.replace(/"/g, '\\"');
        const row = document.querySelector<HTMLElement>(
            `[data-bo-target="invoice:${escaped}"]`,
        );
        if (row) {
            row.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        // Best-effort copy so the operator can paste the invoice ref anywhere.
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard
                .writeText(cn.invoiceNumber)
                .then(() => flash?.("success", `Facture ${cn.invoiceNumber} copiée`))
                .catch(() => undefined);
        }
    };

    const resendEmail = async (cn: AdminCreditNote) => {
        if (!confirm(`Envoyer l'avoir ${cn.number} par e-mail au client ?`)) return;
        setBusyId(cn.id);
        try {
            const res = await authFetch(`${API_URL}/admin/credit-notes/${cn.id}/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { sentTo: string };
            flash?.("success", `Avoir envoyé à ${data.sentTo}`);
        } catch (e) {
            flash?.("error", `Envoi e-mail impossible: ${(e as Error).message}`);
        } finally {
            setBusyId(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Panel title="Avoirs" subtitle={`${total} avoir${total > 1 ? "s" : ""}`}>
            <div className="bo-toolbar" style={{ marginBottom: 12 }}>
                <select
                    className="bo-select"
                    value={reasonFilter}
                    onChange={(e) => {
                        setReasonFilter(e.target.value as "" | AdminCreditNote["reason"]);
                        setPage(1);
                    }}
                >
                    <option value="">Tous motifs</option>
                    <option value="cancellation">Annulation</option>
                    <option value="refund">Remboursement</option>
                    <option value="error">Correction</option>
                </select>
                <button className="bo-btn" type="button" onClick={() => void load()} disabled={loading}>
                    <Icon.Refresh /> {loading ? "Chargement…" : "Rafraîchir"}
                </button>
            </div>

            <div className="bo-table-wrap">
                <table className="bo-table">
                    <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Facture</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Motif</th>
                            <th>Montant TTC</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creditNotes.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={7} className="bo-muted" style={{ textAlign: "center", padding: 24 }}>
                                    Aucun avoir
                                </td>
                            </tr>
                        ) : (
                            creditNotes.map((cn) => (
                                <tr key={cn.id}>
                                    <td className="bo-mono">{cn.number}</td>
                                    <td className="bo-mono">
                                        {cn.invoiceNumber ? (
                                            <button
                                                type="button"
                                                className="bo-link"
                                                onClick={() => focusInvoice(cn)}
                                                title="Voir la facture liée"
                                            >
                                                {cn.invoiceNumber}
                                            </button>
                                        ) : (
                                            <span className="bo-muted">{cn.invoiceId.slice(0, 8)}…</span>
                                        )}
                                    </td>
                                    <td>{formatDate(cn.issuedAt)}</td>
                                    <td>{cn.customerEmail ?? <span className="bo-muted">—</span>}</td>
                                    <td>
                                        <span className="bo-badge">{REASON_LABELS[cn.reason]}</span>
                                    </td>
                                    <td className="bo-mono">{formatNegativeMoney(cn.amountTtcCents, cn.currency)}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="bo-row-actions">
                                            <button
                                                className="bo-btn"
                                                type="button"
                                                disabled={busyId === cn.id}
                                                onClick={() => void downloadPdf(cn)}
                                            >
                                                PDF
                                            </button>
                                            <button
                                                className="bo-btn"
                                                type="button"
                                                disabled={busyId === cn.id || !cn.userId}
                                                onClick={() => void resendEmail(cn)}
                                                title={cn.userId ? "Envoyer par e-mail au client" : "Aucun client lié"}
                                            >
                                                E-mail
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
        </Panel>
    );
}
