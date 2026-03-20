"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

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
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Votre panier est vide</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Découvrez nos équipements médicaux de pointe et commencez vos achats.</p>
        </div>
        <Button size="lg" className="mt-4 rounded-full px-8" asChild>
          <Link href="/products">
            Parcourir le catalogue
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-destructive/10 p-4 text-destructive border border-destructive/20">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={clearError} className="hover:opacity-75">✕</button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Mon Panier</h1>
        <p className="text-muted-foreground mt-1">
          {items.length} article{items.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-12 lg:gap-16 lg:grid-cols-[1.5fr,1fr]">
        {/* Cart Items List */}
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="group flex items-center gap-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{item.name ?? item.productId}</h3>
                <p className="text-sm text-primary font-medium mt-1">
                  {(item.priceCents / 100).toFixed(2)} {item.currency}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  disabled={isLoading}
                  className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-slate-600"
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-4 text-center text-sm font-medium text-slate-700">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                  disabled={isLoading}
                  className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-slate-600"
                >
                  <Plus className="size-3" />
                </Button>
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[80px]">
                <p className="font-bold text-slate-900">
                  {((item.priceCents * item.quantity) / 100).toFixed(2)} {item.currency}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.productId)}
                disabled={isLoading}
                className="text-slate-400 hover:text-destructive transition-colors p-2"
                title="Supprimer"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-3xl bg-slate-50 p-6 sm:p-8 space-y-6 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Récapitulatif</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sous-total</span>
                <span className="font-medium text-slate-900">{(subtotal / 100).toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>TVA (20%)</span>
                <span className="font-medium text-slate-900">{(vat / 100).toFixed(2)} {currency}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success font-medium">
                  <span>Réduction ({promoCode})</span>
                  <span>-{(discount / 100).toFixed(2)} {currency}</span>
                </div>
              )}
            </div>

            <div className="my-6 h-px bg-slate-200" />

            <div className="flex justify-between items-baseline">
              <span className="text-base font-medium text-slate-900">Total TTC</span>
              <span className="text-3xl font-bold text-primary tracking-tight">{(total / 100).toFixed(2)} {currency}</span>
            </div>

            {/* Promo Code */}
            <div className="space-y-3 pt-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Code promo</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="bg-white"
                />
                <Button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  variant="outline"
                  className="bg-white hover:bg-slate-100"
                >
                  {promoLoading ? "..." : "Appliquer"}
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 text-base rounded-xl shadow-lg shadow-primary/20 mt-6" asChild>
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                Passer au paiement <ArrowRight className="size-4" />
              </Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Paiement 100% sécurisé • Expédition sous 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
