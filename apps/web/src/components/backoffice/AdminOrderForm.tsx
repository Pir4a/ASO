"use client";

import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/auth";
import { sanitizePhone } from "@/lib/phone";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type CustomerOption = {
    id: string;
    email: string;
    fullName: string | null;
};

type ProductOption = {
    id: string;
    sku?: string;
    name?: string;
    price?: number;
    stock?: number;
    currency?: string;
};

type LineDraft = {
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
};

type AddressDraft = {
    firstName: string;
    lastName: string;
    street: string;
    address2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
};

const EMPTY_ADDRESS: AddressDraft = {
    firstName: "",
    lastName: "",
    street: "",
    address2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "France",
    phone: "",
};

interface AdminOrderFormProps {
    onClose: () => void;
    onCreated: () => void;
    flash: (kind: "success" | "error", text: string) => void;
}

export function AdminOrderForm({ onClose, onCreated, flash }: AdminOrderFormProps) {
    const [step, setStep] = useState<"customer" | "items" | "address" | "review">("customer");
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customer, setCustomer] = useState<CustomerOption | null>(null);

    const [products, setProducts] = useState<ProductOption[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [lines, setLines] = useState<LineDraft[]>([]);

    const [address, setAddress] = useState<AddressDraft>(EMPTY_ADDRESS);
    const [markAsPaid, setMarkAsPaid] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Customer search — debounced.
    useEffect(() => {
        let cancelled = false;
        const handle = setTimeout(async () => {
            try {
                const sp = new URLSearchParams();
                if (customerSearch.trim()) sp.set("q", customerSearch.trim());
                const res = await authFetch(`${API_URL}/users?${sp.toString()}`);
                if (!res.ok) throw new Error();
                const list = (await res.json()) as CustomerOption[];
                if (!cancelled) setCustomers(list.slice(0, 25));
            } catch {
                if (!cancelled) setCustomers([]);
            }
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [customerSearch]);

    // Products — load once.
    useEffect(() => {
        void (async () => {
            try {
                const res = await authFetch(`${API_URL}/products/admin/all`);
                if (!res.ok) throw new Error();
                setProducts((await res.json()) as ProductOption[]);
            } catch {
                setProducts([]);
            }
        })();
    }, []);

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products.slice(0, 30);
        return products
            .filter(
                (p) =>
                    (p.name?.toLowerCase().includes(q) ?? false) ||
                    (p.sku?.toLowerCase().includes(q) ?? false),
            )
            .slice(0, 30);
    }, [products, productSearch]);

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const addLine = (p: ProductOption) => {
        if (!p.id) return;
        setLines((prev) => {
            const existing = prev.find((l) => l.productId === p.id);
            if (existing) {
                return prev.map((l) =>
                    l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
                );
            }
            return [
                ...prev,
                {
                    productId: p.id,
                    name: p.name ?? "Produit",
                    sku: p.sku ?? "—",
                    price: typeof p.price === "number" ? p.price : 0,
                    quantity: 1,
                },
            ];
        });
    };

    const updateQty = (productId: string, qty: number) => {
        setLines((prev) =>
            prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l)),
        );
    };

    const removeLine = (productId: string) => {
        setLines((prev) => prev.filter((l) => l.productId !== productId));
    };

    const canGoToItems = customer !== null;
    const canGoToAddress = lines.length > 0;
    const canGoToReview =
        address.street.trim().length > 0 &&
        address.city.trim().length > 0 &&
        address.postalCode.trim().length > 0 &&
        address.country.trim().length > 0;

    const submit = async () => {
        if (!customer || lines.length === 0 || submitting) return;
        setSubmitting(true);
        try {
            const body = {
                customerId: customer.id,
                items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
                address: {
                    firstName: address.firstName || undefined,
                    lastName: address.lastName || undefined,
                    street: address.street,
                    address2: address.address2 || undefined,
                    city: address.city,
                    region: address.region || undefined,
                    postalCode: address.postalCode,
                    country: address.country,
                    phone: address.phone || undefined,
                },
                markAsPaid,
                paymentMethod: markAsPaid ? "manual" : undefined,
            };
            const res = await authFetch(`${API_URL}/admin/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { message?: string };
                throw new Error(data.message || `HTTP ${res.status}`);
            }
            const created = (await res.json()) as { orderNumber?: string };
            flash(
                "success",
                created.orderNumber
                    ? `Commande ${created.orderNumber} créée${markAsPaid ? " et marquée payée" : ""}.`
                    : "Commande créée.",
            );
            onCreated();
            onClose();
        } catch (e) {
            flash("error", `Création impossible: ${(e as Error).message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: "fixed",
                inset: 0,
                background: "color-mix(in srgb, #000 35%, transparent)",
                display: "grid",
                placeItems: "center",
                zIndex: 100,
                padding: 16,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 720,
                    maxHeight: "85vh",
                    background: "white",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
                }}
            >
                <header
                    style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--bo-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Backoffice
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700 }}>Nouvelle commande</p>
                    </div>
                    <button type="button" className="bo-btn" onClick={onClose}>
                        Fermer
                    </button>
                </header>

                <nav
                    style={{
                        display: "flex",
                        gap: 4,
                        padding: "8px 20px",
                        borderBottom: "1px solid var(--bo-border)",
                        fontSize: 11,
                    }}
                >
                    {(["customer", "items", "address", "review"] as const).map((s, i) => {
                        const active = step === s;
                        const labels = ["1. Client", "2. Produits", "3. Adresse", "4. Vérification"];
                        return (
                            <span
                                key={s}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 12,
                                    background: active ? "var(--bo-brand)" : "var(--bo-panel-2)",
                                    color: active ? "white" : "var(--bo-text)",
                                    fontWeight: active ? 600 : 500,
                                }}
                            >
                                {labels[i]}
                            </span>
                        );
                    })}
                </nav>

                <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                    {step === "customer" && (
                        <div>
                            <p style={{ fontSize: 13, marginBottom: 8 }}>
                                Recherchez un client par e-mail ou nom.
                            </p>
                            <input
                                type="search"
                                placeholder="Email ou nom…"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="bo-input"
                                style={{ width: "100%" }}
                            />
                            <ul style={{ marginTop: 12, maxHeight: 280, overflowY: "auto" }}>
                                {customers.map((c) => (
                                    <li
                                        key={c.id}
                                        onClick={() => setCustomer(c)}
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            borderRadius: 6,
                                            background:
                                                customer?.id === c.id ? "color-mix(in srgb, var(--bo-brand) 12%, transparent)" : "transparent",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 12,
                                        }}
                                    >
                                        <span>
                                            <strong>{c.fullName ?? "—"}</strong>{" "}
                                            <span className="bo-muted">{c.email}</span>
                                        </span>
                                        {customer?.id === c.id && <span className="bo-badge ok">Sélectionné</span>}
                                    </li>
                                ))}
                                {customers.length === 0 && (
                                    <li className="bo-muted" style={{ fontSize: 12, padding: 12 }}>
                                        Aucun résultat.
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {step === "items" && (
                        <div>
                            <p style={{ fontSize: 13, marginBottom: 8 }}>Ajoutez les produits à la commande.</p>
                            <input
                                type="search"
                                placeholder="Rechercher un produit…"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="bo-input"
                                style={{ width: "100%", marginBottom: 12 }}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <p className="bo-label" style={{ marginBottom: 4 }}>
                                        Catalogue
                                    </p>
                                    <ul style={{ maxHeight: 260, overflowY: "auto" }}>
                                        {filteredProducts.map((p) => (
                                            <li
                                                key={p.id}
                                                onClick={() => addLine(p)}
                                                style={{
                                                    padding: "6px 10px",
                                                    cursor: "pointer",
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    background: "var(--bo-panel-2)",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span>
                                                    <strong>{p.name ?? "—"}</strong>{" "}
                                                    <span className="bo-muted">{p.sku}</span>
                                                </span>
                                                <span className="bo-mono">
                                                    {(p.price ?? 0).toFixed(2)} €
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="bo-label" style={{ marginBottom: 4 }}>
                                        Lignes ({lines.length})
                                    </p>
                                    <ul style={{ maxHeight: 260, overflowY: "auto" }}>
                                        {lines.length === 0 && (
                                            <li className="bo-muted" style={{ fontSize: 12, padding: 6 }}>
                                                Aucune ligne. Cliquez un produit à gauche.
                                            </li>
                                        )}
                                        {lines.map((l) => (
                                            <li
                                                key={l.productId}
                                                style={{
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    marginBottom: 4,
                                                    background: "var(--bo-panel-2)",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {l.name}
                                                </span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={l.quantity}
                                                    onChange={(e) => updateQty(l.productId, Number(e.target.value) || 1)}
                                                    className="bo-input compact"
                                                    style={{ width: 60 }}
                                                />
                                                <span className="bo-mono" style={{ fontSize: 11, minWidth: 70, textAlign: "right" }}>
                                                    {(l.price * l.quantity).toFixed(2)} €
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(l.productId)}
                                                    className="bo-btn"
                                                    style={{ padding: "2px 8px", fontSize: 11 }}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>
                                Total: {total.toFixed(2)} €
                            </p>
                        </div>
                    )}

                    {step === "address" && (
                        <div>
                            <p style={{ fontSize: 13, marginBottom: 12 }}>Adresse de livraison.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <input
                                    placeholder="Prénom"
                                    value={address.firstName}
                                    onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    placeholder="Nom"
                                    value={address.lastName}
                                    onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    placeholder="Rue *"
                                    value={address.street}
                                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                    className="bo-input"
                                    style={{ gridColumn: "span 2" }}
                                />
                                <input
                                    placeholder="Complément"
                                    value={address.address2}
                                    onChange={(e) => setAddress({ ...address, address2: e.target.value })}
                                    className="bo-input"
                                    style={{ gridColumn: "span 2" }}
                                />
                                <input
                                    placeholder="Code postal *"
                                    value={address.postalCode}
                                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    placeholder="Ville *"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    placeholder="Région"
                                    value={address.region}
                                    onChange={(e) => setAddress({ ...address, region: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    placeholder="Pays *"
                                    value={address.country}
                                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                                    className="bo-input"
                                />
                                <input
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    pattern="\+?\d{4,20}"
                                    maxLength={21}
                                    placeholder="Téléphone"
                                    value={address.phone}
                                    onChange={(e) => setAddress({ ...address, phone: sanitizePhone(e.target.value) })}
                                    className="bo-input"
                                    style={{ gridColumn: "span 2" }}
                                />
                            </div>
                        </div>
                    )}

                    {step === "review" && (
                        <div style={{ fontSize: 13 }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong>Client&nbsp;:</strong>{" "}
                                {customer?.fullName ?? "—"} ({customer?.email})
                            </p>
                            <p style={{ marginBottom: 8 }}>
                                <strong>Adresse&nbsp;:</strong> {address.street}, {address.postalCode}{" "}
                                {address.city}, {address.country}
                            </p>
                            <p style={{ marginBottom: 8, fontWeight: 600 }}>Articles :</p>
                            <ul style={{ marginBottom: 12 }}>
                                {lines.map((l) => (
                                    <li key={l.productId} style={{ fontSize: 12 }}>
                                        {l.name} × {l.quantity} — {(l.price * l.quantity).toFixed(2)} €
                                    </li>
                                ))}
                            </ul>
                            <p style={{ fontWeight: 700, marginBottom: 16 }}>Total: {total.toFixed(2)} €</p>
                            <label className="bo-hstack" style={{ gap: 8, fontSize: 12 }}>
                                <input
                                    type="checkbox"
                                    checked={markAsPaid}
                                    onChange={(e) => setMarkAsPaid(e.target.checked)}
                                />
                                Marquer comme payée immédiatement (paiement manuel hors ligne)
                            </label>
                            <p className="bo-muted" style={{ fontSize: 11, marginTop: 4 }}>
                                Si coché : statut <strong>processing</strong>, paiement <strong>paid</strong>, facture
                                générée. Sinon : statut <strong>pending</strong>, paiement <strong>unpaid</strong>.
                            </p>
                        </div>
                    )}
                </div>

                <footer
                    style={{
                        padding: "12px 20px",
                        borderTop: "1px solid var(--bo-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <button
                        type="button"
                        className="bo-btn"
                        onClick={() => {
                            if (step === "customer") return;
                            const order = ["customer", "items", "address", "review"] as const;
                            const idx = order.indexOf(step);
                            setStep(order[Math.max(0, idx - 1)]);
                        }}
                        disabled={step === "customer"}
                    >
                        ← Retour
                    </button>
                    {step !== "review" ? (
                        <button
                            type="button"
                            className="bo-btn primary"
                            onClick={() => {
                                if (step === "customer" && canGoToItems) setStep("items");
                                else if (step === "items" && canGoToAddress) setStep("address");
                                else if (step === "address" && canGoToReview) setStep("review");
                            }}
                            disabled={
                                (step === "customer" && !canGoToItems) ||
                                (step === "items" && !canGoToAddress) ||
                                (step === "address" && !canGoToReview)
                            }
                        >
                            Suivant →
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="bo-btn primary"
                            onClick={() => void submit()}
                            disabled={submitting}
                        >
                            {submitting ? "Création…" : "Créer la commande"}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
