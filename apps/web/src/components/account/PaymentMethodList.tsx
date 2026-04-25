"use client";

import { useCallback, useEffect, useState } from "react";
import { AddPaymentMethod } from "./AddPaymentMethod";
import { authFetch } from "@/lib/auth";

interface PaymentMethod {
    id: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    isDefault?: boolean;
}

const BRAND_LABEL: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners",
    jcb: "JCB",
    unionpay: "UnionPay",
};

function brandLabel(b?: string) {
    if (!b) return "Carte";
    return BRAND_LABEL[b.toLowerCase()] ?? b.charAt(0).toUpperCase() + b.slice(1);
}

function formatExpiry(m?: number, y?: number) {
    if (!m || !y) return "";
    return `${String(m).padStart(2, "0")}/${String(y).slice(-2)}`;
}

export function PaymentMethodList() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);

    const flashAndClear = (kind: "success" | "error", text: string) => {
        setFlash({ kind, text });
        window.setTimeout(() => setFlash(null), 3500);
    };

    const fetchMethods = useCallback(async () => {
        try {
            const res = await authFetch("/payment/methods");
            if (res.ok) {
                setMethods((await res.json()) as PaymentMethod[]);
            } else if (res.status === 503) {
                flashAndClear("error", "Stripe n'est pas configuré sur le serveur.");
                setMethods([]);
            } else {
                setMethods([]);
            }
        } catch {
            setMethods([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchMethods();
    }, [fetchMethods]);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce moyen de paiement ?")) return;
        setBusy(id);
        try {
            const res = await authFetch(`/payment/methods/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Suppression impossible.");
            await fetchMethods();
            flashAndClear("success", "Moyen de paiement retiré.");
        } catch (e) {
            flashAndClear(
                "error",
                e instanceof Error ? e.message : "Suppression impossible.",
            );
        } finally {
            setBusy(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        setBusy(id);
        try {
            const res = await authFetch(`/payment/methods/${id}/default`, { method: "PATCH" });
            if (!res.ok) throw new Error("Mise à jour impossible.");
            await fetchMethods();
            flashAndClear("success", "Carte définie par défaut.");
        } catch (e) {
            flashAndClear(
                "error",
                e instanceof Error ? e.message : "Mise à jour impossible.",
            );
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-10 text-center text-sm text-foreground/55">
                    Chargement…
                </div>
            ) : methods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-10 text-center text-sm text-foreground/55">
                    Aucune carte enregistrée. Ajoutez-en une pour accélérer vos achats.
                </div>
            ) : (
                <ul className="space-y-3" role="list">
                    {methods.map((pm) => {
                        const isDefault = !!pm.isDefault;
                        const isBusy = busy === pm.id;
                        return (
                            <li
                                key={pm.id}
                                className={`flex flex-wrap items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition ${
                                    isDefault
                                        ? "border-primary/40 ring-1 ring-primary/15"
                                        : "border-foreground/10 hover:border-primary-hover"
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className="grid h-10 w-14 place-items-center rounded-lg bg-foreground text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                                >
                                    {brandLabel(pm.brand).slice(0, 4)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-heading text-[14.5px] font-semibold text-foreground">
                                        {brandLabel(pm.brand)}{" "}
                                        <span className="font-mono text-foreground/65">
                                            •••• {pm.last4 ?? "••••"}
                                        </span>
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-foreground/55">
                                        Expire {formatExpiry(pm.expMonth, pm.expYear)}
                                    </p>
                                </div>
                                {isDefault && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3 w-3">
                                            <path d="m3 8 3.5 3.5L13 5" />
                                        </svg>
                                        Par défaut
                                    </span>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    {!isDefault && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetDefault(pm.id)}
                                            disabled={isBusy}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 bg-white px-3 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                                                <path d="m3 8 3.5 3.5L13 5" />
                                            </svg>
                                            Définir par défaut
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(pm.id)}
                                        disabled={isBusy}
                                        aria-label="Supprimer la carte"
                                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error/25 bg-white px-3 text-[12px] font-semibold text-error transition hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                                            <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-5 0v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
                                        </svg>
                                        Supprimer
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {flash && (
                <div
                    role="status"
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] ${
                        flash.kind === "success"
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-error/30 bg-error/10 text-error"
                    }`}
                >
                    {flash.kind === "success" ? (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d="m3 8 3.5 3.5L13 5" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                            <circle cx="8" cy="8" r="6" />
                            <path d="m4.5 4.5 7 7" />
                        </svg>
                    )}
                    {flash.text}
                </div>
            )}

            <AddPaymentMethod onAdded={fetchMethods} />
        </div>
    );
}
