"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";
import { Panel, Icon } from "@/components/backoffice/DashboardUI";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type AdminInvoice = {
    id: string;
    number: string;
    orderId: string;
    userId: string | null;
    customerEmail: string | null;
    totalHtCents: number;
    totalTvaCents: number;
    totalTtcCents: number;
    currency: string;
    status: "paid" | "cancelled";
    issuedAt: string;
    pdfUrl: string | null;
};

type ListResponse = {
    page: number;
    pageSize: number;
    total: number;
    invoices: AdminInvoice[];
};

const formatMoney = (cents: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
    }).format(cents / 100);

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export function InvoicesPanel({ flash }: { flash?: (kind: "success" | "error", text: string) => void }) {
    const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<"" | "paid" | "cancelled">("");
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (statusFilter) sp.set("status", statusFilter);
            const res = await authFetch(`${API_URL}/admin/invoices?${sp.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: ListResponse = await res.json();
            setInvoices(data.invoices);
            setTotal(data.total);
        } catch (e) {
            flash?.("error", `Impossible de charger les factures: ${(e as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, statusFilter, flash]);

    useEffect(() => {
        void load();
    }, [load]);

    const downloadPdf = async (invoice: AdminInvoice) => {
        setBusyId(invoice.id);
        try {
            const res = await authFetch(`${API_URL}/admin/invoices/${invoice.id}/pdf`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `facture-${invoice.number}.pdf`;
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

    const resendEmail = async (invoice: AdminInvoice) => {
        if (!confirm(`Renvoyer la facture ${invoice.number} par e-mail ?`)) return;
        setBusyId(invoice.id);
        try {
            const res = await authFetch(`${API_URL}/admin/invoices/${invoice.id}/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { sentTo: string };
            flash?.("success", `Facture envoyée à ${data.sentTo}`);
        } catch (e) {
            flash?.("error", `Envoi e-mail impossible: ${(e as Error).message}`);
        } finally {
            setBusyId(null);
        }
    };

    const cancelInvoice = async (invoice: AdminInvoice) => {
        if (invoice.status === "cancelled") return;
        if (!confirm(`Marquer la facture ${invoice.number} comme annulée ?`)) return;
        setBusyId(invoice.id);
        try {
            const res = await authFetch(`${API_URL}/admin/invoices/${invoice.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            flash?.("success", `Facture ${invoice.number} annulée`);
            await load();
        } catch (e) {
            flash?.("error", `Mise à jour impossible: ${(e as Error).message}`);
        } finally {
            setBusyId(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Panel title="Factures" subtitle={`${total} facture${total > 1 ? "s" : ""}`}>
            <div className="bo-toolbar" style={{ marginBottom: 12 }}>
                <select
                    className="bo-select"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as "" | "paid" | "cancelled");
                        setPage(1);
                    }}
                >
                    <option value="">Tous statuts</option>
                    <option value="paid">Payées</option>
                    <option value="cancelled">Annulées</option>
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
                            <th>Client</th>
                            <th>Date</th>
                            <th>Total TTC</th>
                            <th>Statut</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={6} className="bo-muted" style={{ textAlign: "center", padding: 24 }}>
                                    Aucune facture
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td className="bo-mono">{inv.number}</td>
                                    <td>{inv.customerEmail ?? <span className="bo-muted">—</span>}</td>
                                    <td>{formatDate(inv.issuedAt)}</td>
                                    <td className="bo-mono">{formatMoney(inv.totalTtcCents, inv.currency)}</td>
                                    <td>
                                        {inv.status === "paid" ? (
                                            <span className="bo-badge ok">Payée</span>
                                        ) : (
                                            <span className="bo-badge danger">Annulée</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="bo-row-actions">
                                            <button
                                                className="bo-btn"
                                                type="button"
                                                disabled={busyId === inv.id}
                                                onClick={() => void downloadPdf(inv)}
                                            >
                                                PDF
                                            </button>
                                            <button
                                                className="bo-btn"
                                                type="button"
                                                disabled={busyId === inv.id || !inv.customerEmail}
                                                onClick={() => void resendEmail(inv)}
                                                title={inv.customerEmail ? "Renvoyer par e-mail" : "Pas de destinataire"}
                                            >
                                                E-mail
                                            </button>
                                            {inv.status === "paid" && (
                                                <button
                                                    className="bo-btn danger"
                                                    type="button"
                                                    disabled={busyId === inv.id}
                                                    onClick={() => void cancelInvoice(inv)}
                                                >
                                                    Annuler
                                                </button>
                                            )}
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
