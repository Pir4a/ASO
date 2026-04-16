"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";

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

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(productId);
    } else {
      await updateItem(productId, newQuantity);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background">
          <svg className="h-8 w-8 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Votre panier est vide</h2>
        <p className="text-foreground/70">Ajoutez des produits pour commencer vos achats.</p>
        <Link
          href="/products"
          className="inline-flex justify-center rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
        >
          Parcourir les produits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-error/15 p-4 text-error">
          <span>{error}</span>
          <button onClick={clearError} className="text-error hover:text-error/80">✕</button>
        </div>
      )}

      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Panier</h1>
        <p className="text-sm text-foreground/70">
          {items.length} article{items.length > 1 ? "s" : ""} dans votre panier
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-lg bg-background p-4 shadow-sm"
            >
              {/* Product Info */}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{item.name ?? item.productId}</p>
                <p className="text-sm text-primary">
                  {(item.priceCents / 100).toFixed(2)} {item.currency}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  disabled={isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/25 text-foreground/70 hover:bg-background disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                  disabled={isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/25 text-foreground/70 hover:bg-background disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {/* Item Total */}
              <div className="w-24 text-right">
                <p className="font-semibold text-foreground">
                  {((item.priceCents * item.quantity) / 100).toFixed(2)} {item.currency}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.productId)}
                disabled={isLoading}
                className="text-error hover:text-error disabled:opacity-50"
                title="Supprimer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-foreground">Récapitulatif</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>Sous-total</span>
                <span>{(subtotal / 100).toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>TVA (20%)</span>
                <span>{(vat / 100).toFixed(2)} {currency}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Réduction ({promoCode})</span>
                  <span>-{(discount / 100).toFixed(2)} {currency}</span>
                </div>
              )}
            </div>

            <hr className="border-primary/25" />

            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total</span>
              <span>{(total / 100).toFixed(2)} {currency}</span>
            </div>

            {/* Promo Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90">Code promo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="PROMO2025"
                  className="flex-1 rounded-md border border-primary/25 px-3 py-2 text-sm uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-50"
                >
                  {promoLoading ? "..." : "Appliquer"}
                </button>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-4 inline-flex w-full justify-center rounded-md bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              Passer au checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
