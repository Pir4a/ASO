"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { downloadOrderInvoice, getOrder, type OrderDTO, type OrderStatus } from "@/lib/api";

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inattendue.");
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

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
        >
          <span aria-hidden="true">‹</span> Retour à mes commandes
        </Link>
      </div>

      {loading && (
        <div className="card p-6">
          <p className="text-sm text-foreground/70">Chargement de la commande…</p>
        </div>
      )}

      {error && !loading && (
        <div className="card p-6">
          <p className="text-sm text-error">Impossible de charger la commande : {error}</p>
        </div>
      )}

      {!loading && !error && order && (
        <>
          <div className="card p-6 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Commande <span className="font-mono">{order.id}</span>
                </h1>
                <p className="mt-1 text-sm text-foreground/70">
                  Passée le {formatDate(order.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
          </div>

          {/* Products */}
          <section className="card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Produits</h2>
            <ul className="divide-y divide-foreground/10">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    {item.productSku && (
                      <p className="text-xs text-foreground/60">
                        Réf. <span className="font-mono">{item.productSku}</span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-foreground">
                      {item.quantity} × {Number(item.price).toFixed(2)} {item.currency}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {(Number(item.price) * item.quantity).toFixed(2)} {item.currency}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">
                {Number(order.total).toFixed(2)} {order.currency}
              </span>
            </div>
          </section>

          {/* Payment & billing */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-6 space-y-2">
              <h2 className="text-base font-semibold text-foreground">Paiement</h2>
              {order.paymentMethod ? (
                <p className="text-sm text-foreground/80">
                  <span className="capitalize">{order.paymentMethod}</span>
                  {order.paymentLast4 && (
                    <>
                      {" "}
                      — carte terminant par{" "}
                      <span className="font-mono">•••• {order.paymentLast4}</span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-foreground/60">Information indisponible.</p>
              )}
              {order.paymentStatus && (
                <p className="text-xs text-foreground/60">Statut : {order.paymentStatus}</p>
              )}
            </section>

            <section className="card p-6 space-y-2">
              <h2 className="text-base font-semibold text-foreground">Adresse de facturation</h2>
              {order.billingAddress ? (
                <address className="not-italic text-sm text-foreground/80">
                  {order.billingAddress.street && <div>{order.billingAddress.street}</div>}
                  <div>
                    {[order.billingAddress.postalCode, order.billingAddress.city]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  {order.billingAddress.country && <div>{order.billingAddress.country}</div>}
                  {order.billingAddress.phone && (
                    <div className="text-foreground/60">{order.billingAddress.phone}</div>
                  )}
                </address>
              ) : order.shippingAddress ? (
                <>
                  <p className="text-xs text-foreground/60">
                    Identique à l&apos;adresse de livraison.
                  </p>
                  <address className="not-italic text-sm text-foreground/80">
                    {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                    <div>
                      {[order.shippingAddress.postalCode, order.shippingAddress.city]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    {order.shippingAddress.country && (
                      <div>{order.shippingAddress.country}</div>
                    )}
                  </address>
                </>
              ) : (
                <p className="text-sm text-foreground/60">
                  Aucune adresse de facturation enregistrée.
                </p>
              )}
            </section>
          </div>

          {/* Invoice */}
          <section className="card p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Facture</h2>
                <p className="text-sm text-foreground/70">
                  Téléchargez votre facture au format PDF pour vos archives.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={invoiceLoading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {invoiceLoading ? "Génération…" : "Télécharger la facture (PDF)"}
              </button>
            </div>
            {invoiceError && <p className="text-sm text-error">{invoiceError}</p>}
          </section>
        </>
      )}
    </div>
  );
}
