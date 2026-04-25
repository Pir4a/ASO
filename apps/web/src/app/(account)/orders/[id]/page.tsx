"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  downloadOrderInvoice,
  getOrder,
  type OrderDTO,
  type OrderStatus,
} from "@/lib/api";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  processing: "En traitement",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function statusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-success/10 text-success";
    case "cancelled":
      return "bg-error/10 text-error";
    case "shipped":
      return "bg-foreground/10 text-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
}

function formatDate(iso?: string | Date): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function brandLabel(b?: string) {
  if (!b) return "Carte";
  return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getOrder(id);
        if (!cancelled) setOrder(result);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur inattendue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      await downloadOrderInvoice(order.id);
    } catch (e) {
      setInvoiceError(
        e instanceof Error ? e.message : "Impossible de télécharger la facture.",
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Breadcrumb here="Commande" />
        <div className="rounded-2xl border border-error/30 bg-error/10 px-6 py-12 text-center text-error">
          {error ?? "Commande introuvable."}
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber ?? `ALT-${order.id.slice(0, 8).toUpperCase()}`;
  const billing = order.billingAddress ?? order.shippingAddress;

  return (
    <div className="space-y-6">
      <Breadcrumb here={orderNumber} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
            Commande
          </p>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            {orderNumber}
          </h1>
          <p className="mt-1 text-[13px] text-foreground/60">
            Passée le {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${statusTone(order.status)}`}
          >
            <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-white px-3 py-2 text-[12.5px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
              <path d="M13 8H3m3-3-3 3 3 3" />
            </svg>
            Toutes mes commandes
          </Link>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_minmax(0,1fr)]">
        {/* ── Items ──────────────────────────────────────── */}
        <div className="space-y-5">
          <SectionCard
            eyebrow="Produits"
            title="Articles commandés"
            hint="Récapitulatif détaillé des lignes facturées."
          >
            <ul className="divide-y divide-foreground/5" role="list">
              {(order.items ?? []).map((item) => {
                const unit = Number(item.price);
                const lineTotal = unit * item.quantity;
                return (
                  <li
                    key={item.id}
                    className="grid items-baseline gap-2 py-4 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-[15px] font-semibold text-foreground">
                        {item.productName}
                      </p>
                      {item.productSku && (
                        <p className="mt-0.5 font-mono text-[11px] text-foreground/55">
                          Réf. {item.productSku}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[13px] text-foreground/65 sm:min-w-[140px]">
                      <p className="tabular-nums">
                        {formatPrice(unit, item.currency)}
                      </p>
                      <p className="text-[11.5px] tabular-nums">×&nbsp;{item.quantity}</p>
                    </div>
                    <p className="text-right font-heading text-[15px] font-bold tabular-nums text-foreground sm:min-w-[120px]">
                      {formatPrice(lineTotal, item.currency)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-foreground/10 pt-4">
              <span className="font-heading text-[14px] font-semibold text-foreground">
                Total TTC
              </span>
              <span className="font-heading text-[22px] font-bold tabular-nums text-foreground">
                {formatPrice(Number(order.total), order.currency)}
              </span>
            </div>
          </SectionCard>

          {/* ── Invoice ─────────────────────────────────── */}
          <SectionCard
            eyebrow="Facture"
            title="Document PDF"
            hint="Téléchargez votre facture pour vos archives comptables."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[13px] text-foreground/65">
                Format A4 · branding Althea Systems · TVA détaillée.
              </div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={invoiceLoading}
                style={{ color: "#fff" }}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[13.5px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invoiceLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Génération…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M8 2v8m0 0 3-3m-3 3-3-3M3 13h10" />
                    </svg>
                    Télécharger la facture (PDF)
                  </>
                )}
              </button>
            </div>
            {invoiceError && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12.5px] text-error">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="m4.5 4.5 7 7" />
                </svg>
                {invoiceError}
              </p>
            )}
          </SectionCard>
        </div>

        {/* ── Summary sidebar ─────────────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-44">
          {/* Payment */}
          <SectionCard eyebrow="Paiement" title="Méthode utilisée">
            {order.paymentLast4 ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-14 place-items-center rounded-lg bg-foreground text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ color: "#fff" }}
                >
                  {brandLabel(order.paymentBrand).slice(0, 4)}
                </span>
                <div>
                  <p className="font-heading text-[14px] font-semibold text-foreground">
                    {brandLabel(order.paymentBrand)}{" "}
                    <span className="font-mono text-foreground/65">
                      •••• {order.paymentLast4}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-foreground/60">
                    Statut ·{" "}
                    {order.paymentStatus === "paid"
                      ? "Payée"
                      : (order.paymentStatus ?? "—")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-foreground/60">
                Information de paiement indisponible.
              </p>
            )}
          </SectionCard>

          {/* Billing */}
          <SectionCard
            eyebrow="Adresse"
            title="Facturation et livraison"
          >
            {billing ? (
              <address className="not-italic space-y-0.5 text-[13.5px] text-foreground">
                {(billing.firstName || billing.lastName) && (
                  <p className="font-heading font-semibold">
                    {[billing.firstName, billing.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
                {billing.street && <p>{billing.street}</p>}
                {billing.address2 && <p className="text-foreground/65">{billing.address2}</p>}
                {(billing.postalCode || billing.city) && (
                  <p>
                    <span className="tabular-nums">{billing.postalCode}</span>{" "}
                    {billing.city}
                    {billing.region ? `, ${billing.region}` : ""}
                  </p>
                )}
                {billing.country && <p className="text-foreground/65">{billing.country}</p>}
                {billing.phone && (
                  <p className="mt-1.5 text-[12px] text-foreground/60">
                    {billing.phone}
                  </p>
                )}
              </address>
            ) : (
              <p className="text-[13px] text-foreground/60">
                Aucune adresse enregistrée.
              </p>
            )}
          </SectionCard>

          {/* Status timeline */}
          {(order.statusHistory ?? []).length > 0 && (
            <SectionCard eyebrow="Suivi" title="Historique">
              <ol className="space-y-2.5" role="list">
                {(order.statusHistory ?? []).map((h, i) => (
                  <li key={`${h.status}-${i}`} className="flex items-start gap-3 text-[12.5px]">
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-2 w-2 flex-none rounded-full bg-primary"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {STATUS_LABELS[h.status] ?? h.status}
                      </p>
                      <p className="text-[11px] text-foreground/55">
                        {new Date(h.at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function Breadcrumb({ here }: { here: string }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
    >
      <Link href="/" className="hover:text-primary">
        Accueil
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <Link href="/orders" className="hover:text-primary">
        Mes commandes
      </Link>
      <span aria-hidden="true" className="text-foreground/25">/</span>
      <span className="font-semibold text-foreground">{here}</span>
    </nav>
  );
}

function SectionCard({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <header className="border-b border-foreground/5 px-6 py-5">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="font-heading text-[18px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="mt-1 text-[13px] text-foreground/60">{hint}</p>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
