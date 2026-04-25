"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart, type CartItem } from "@/hooks/useCart";

function isUnavailable(item: CartItem) {
  return typeof item.stock === "number" && item.stock <= 0;
}

function formatPrice(cents: number, currency: string) {
  const v = cents / 100;
  return `${v >= 1000 ? v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2)} ${currency}`;
}

export default function CartPage() {
  const {
    items,
    subtotal,
    vat,
    total,
    discount,
    promoCode,
    currency,
    isLoading,
    error,
    updateItem,
    removeItem,
    applyPromo,
    clearError,
  } = useCart();
  const { isAuthenticated } = useAuth();

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const itemCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items],
  );
  const blockedByOOS = useMemo(() => items.some(isUnavailable), [items]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      await applyPromo(promoInput.trim());
      setPromoInput("");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleQuantityChange = async (productId: string, q: number) => {
    setBusyId(productId);
    try {
      if (q < 1) await removeItem(productId);
      else await updateItem(productId, q);
    } finally {
      setBusyId(null);
    }
  };

  /* ── Loading / empty states ─────────────────────────────── */
  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white px-6 py-16 text-center">
          <div
            aria-hidden="true"
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-background text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
          </div>
          <h1 className="mt-5 font-heading text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            Votre panier est vide
          </h1>
          <p className="mt-2 text-sm text-foreground/65">
            Ajoutez des produits pour commencer vos achats.
          </p>
          <Link
            href="/products"
            style={{ color: "#fff" }}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold transition hover:bg-primary-hover"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 8h10m-3-3 3 3-3 3" />
            </svg>
            Parcourir le catalogue
          </Link>
        </section>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <Breadcrumb />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
            Panier
          </p>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
            Récapitulatif de votre commande
          </h1>
          <p className="mt-1 text-[13px] text-foreground/60">
            {itemCount} article{itemCount > 1 ? "s" : ""} · total mis à jour automatiquement
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1.5 text-[13px] font-semibold text-primary transition hover:text-primary-hover sm:inline-flex"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="M13 8H3m3-3-3 3 3 3" />
          </svg>
          Continuer mes achats
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-[13.5px] text-error"
        >
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="8" cy="8" r="6" />
              <path d="m4.5 4.5 7 7" />
            </svg>
            {error}
          </span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Fermer"
            className="text-error/80 transition hover:text-error"
          >
            ✕
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 border-l-4 bg-primary/5 px-4 py-3.5 text-[13.5px] text-foreground">
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-4 w-4 text-primary">
              <circle cx="8" cy="6" r="2.6" />
              <path d="M2.5 14c0-2.6 2.4-4.6 5.5-4.6s5.5 2 5.5 4.6" />
            </svg>
            <span>
              <b className="font-semibold">Connectez-vous</b> ou créez un compte pour sauvegarder
              votre panier — vous pouvez aussi continuer en invité.
            </span>
          </span>
          <span className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary/30 bg-white px-3 text-[12.5px] font-semibold text-primary transition hover:border-primary"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              style={{ color: "#fff" }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold transition hover:bg-primary-hover"
            >
              Créer un compte
            </Link>
          </span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_minmax(0,1fr)]">
        {/* Items */}
        <ul className="space-y-3" role="list">
          {items.map((item) => {
            const oos = isUnavailable(item);
            const stockExceeded =
              !oos &&
              typeof item.stock === "number" &&
              item.stock < item.quantity;
            const isBusy = busyId === item.productId || isLoading;
            return (
              <li
                key={item.productId}
                className={`overflow-hidden rounded-xl border bg-white transition ${
                  oos
                    ? "border-error/30 bg-error/5"
                    : "border-foreground/10 hover:border-primary-hover"
                }`}
              >
                <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                  {/* Product thumbnail (real image, falls back to brand icon) */}
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-foreground/5 bg-gradient-to-br from-background to-white">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className={`object-cover ${oos ? "grayscale" : ""}`}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-7 w-7">
                          <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name + unit price */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-heading text-[15px] font-semibold leading-snug ${
                        oos ? "text-foreground/55" : "text-foreground"
                      }`}
                    >
                      {item.name ?? item.productId}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-foreground/60">
                      Prix unitaire ·{" "}
                      <span className="font-medium text-foreground/80 tabular-nums">
                        {formatPrice(item.priceCents, item.currency)}
                      </span>
                    </p>
                    {oos && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-error">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                          <circle cx="8" cy="8" r="6" />
                          <path d="m4.5 4.5 7 7" />
                        </svg>
                        Indisponible — retirez ou remplacez ce produit
                      </p>
                    )}
                    {stockExceeded && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-warning">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                          <path d="M8 2.5 14 13H2L8 2.5Z" />
                          <path d="M8 7v3M8 11.5v.5" />
                        </svg>
                        Stock limité — {item.stock} disponible{(item.stock ?? 0) > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* Quantity stepper */}
                  <div
                    className="flex h-10 items-stretch overflow-hidden rounded-lg border border-foreground/15 bg-white"
                    role="group"
                    aria-label={`Quantité de ${item.name ?? "ce produit"}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity - 1)
                      }
                      disabled={isBusy || oos}
                      aria-label="Diminuer"
                      className="grid w-9 place-items-center text-foreground transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:text-foreground/30 disabled:hover:bg-transparent"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3 w-3">
                        <path d="M3 8h10" />
                      </svg>
                    </button>
                    <span className="grid w-9 place-items-center border-x border-foreground/10 font-heading text-[14px] font-semibold tabular-nums text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity + 1)
                      }
                      disabled={isBusy || oos}
                      aria-label="Augmenter"
                      className="grid w-9 place-items-center text-foreground transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:text-foreground/30 disabled:hover:bg-transparent"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3 w-3">
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="w-28 text-right">
                    <p
                      className={`font-heading text-[16px] font-bold tabular-nums ${
                        oos ? "text-foreground/55 line-through" : "text-foreground"
                      }`}
                    >
                      {formatPrice(item.priceCents * item.quantity, item.currency)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    disabled={isBusy}
                    aria-label="Retirer du panier"
                    className="grid h-9 w-9 place-items-center rounded-md text-foreground/55 transition hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
                      <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-5 0v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-44">
          <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
            <header className="border-b border-foreground/5 px-6 py-5">
              <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                Récapitulatif
              </p>
              <h2 className="font-heading text-[18px] font-semibold tracking-tight text-foreground">
                Total à payer
              </h2>
            </header>
            <div className="space-y-4 px-6 py-5">
              <dl className="space-y-2 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-foreground/65">Sous-total</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatPrice(subtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground/65">TVA</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatPrice(vat, currency)}
                  </dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>
                      Réduction{" "}
                      <span className="font-mono text-[12px] text-success/80">
                        ({promoCode})
                      </span>
                    </dt>
                    <dd className="tabular-nums">
                      −{formatPrice(discount, currency)}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex items-baseline justify-between border-t border-foreground/10 pt-4">
                <span className="font-heading text-[14px] font-semibold text-foreground">
                  Total TTC
                </span>
                <span className="font-heading text-[22px] font-bold tabular-nums text-foreground">
                  {formatPrice(total, currency)}
                </span>
              </div>

              {/* Promo code */}
              <div>
                <label
                  htmlFor="promo-input"
                  className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/60"
                >
                  Code promo
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="min-w-0 flex-1 rounded-lg border border-foreground/10 bg-white px-3 py-2.5 font-mono text-[13px] uppercase text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-foreground/15 bg-white px-3 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {promoLoading ? "…" : "Appliquer"}
                  </button>
                </div>
              </div>

              {/* CTA */}
              {blockedByOOS && (
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[12.5px] text-error">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-none">
                    <path d="M8 2.5 14 13H2L8 2.5Z" />
                    <path d="M8 7v3M8 11.5v.5" />
                  </svg>
                  Un ou plusieurs articles sont indisponibles. Retirez-les ou remplacez-les
                  pour continuer.
                </div>
              )}

              {blockedByOOS ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-foreground/10 px-5 text-[15px] font-semibold text-foreground/55"
                >
                  Passer à la caisse
                </button>
              ) : (
                <Link
                  href="/checkout"
                  style={{ color: "#fff" }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold transition hover:bg-primary-hover"
                >
                  Passer à la caisse
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="M3 8h10m-3-3 3 3-3 3" />
                  </svg>
                </Link>
              )}

              <ul className="grid grid-cols-3 gap-2 border-t border-foreground/5 pt-4 text-center text-[11px] text-foreground/65">
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <path d="M1 4h13v9H1V4Zm13 3h4l3 3v3h-7" />
                    <circle cx="5" cy="16" r="1.5" />
                    <circle cx="17" cy="16" r="1.5" />
                  </svg>
                  Livraison 48 h
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Paiement sécurisé
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4 text-primary">
                    <path d="M12 2 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-5z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Garantie 2 ans
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
    >
      <Link href="/" className="hover:text-primary">
        Accueil
      </Link>
      <span aria-hidden="true" className="text-foreground/25">
        /
      </span>
      <span className="font-semibold text-foreground">Panier</span>
    </nav>
  );
}
