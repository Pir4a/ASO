"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserAddresses, createUserAddress, createOrder, getCart, createPaymentIntent } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Address = {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
};

type Step = "address" | "payment" | "confirmation";

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("EUR");
  const [orderResult, setOrderResult] = useState<{ id: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: ""
  });

  useEffect(() => {
    // Fetch initial data
    Promise.all([getUserAddresses(), getCart()]).then(([addr, cart]) => {
      setAddresses(addr);
      if (addr.length > 0) setSelectedAddressId(addr[0].id);
      setCartTotal(cart.total);
      setCurrency(cart.currency);
    });
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const created = await createUserAddress(newAddress);
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      // Reset form
      setNewAddress({ street: "", city: "", postalCode: "", country: "France", phone: "" });
    } catch (error) {
      alert("Erreur lors de la création de l'adresse");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToPayment = async () => {
    if (!selectedAddressId) return;
    setIsLoading(true);
    try {
      // 1. Create Order
      const order = await createOrder(selectedAddressId);
      setOrderResult(order);

      // 2. Create Payment Intent
      const intent = await createPaymentIntent(order.id);
      setClientSecret(intent.clientSecret);

      setStep("payment");
    } catch (error) {
      // alert("Erreur lors de la préparation de la commande");
      console.error(error);
      alert("Erreur technique: Impossible d'initialiser le paiement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setStep("confirmation");
  };

  if (step === "confirmation" && orderResult) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Commande Confirmée !</h2>
        <p className="text-slate-600">
          Merci pour votre achat. Votre numéro de commande est <span className="font-mono font-bold text-slate-900">{orderResult.id}</span>.
        </p>
        <div className="pt-4">
          <Link href="/products" className="inline-flex justify-center rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Steps Indicator */}
        <div className="flex items-center space-x-4 mb-8">
          {["address", "payment", "confirmation"].map((s, idx) => (
            <div key={s} className={`flex items-center ${step === s ? "text-primary font-bold" : "text-slate-500"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 mr-2 ${step === s ? "border-primary bg-primary/10" : "border-slate-300"}`}>
                {idx + 1}
              </span>
              <span className="capitalize">{s === "address" ? "Adresse" : s === "payment" ? "Paiement" : "Confirmation"}</span>
            </div>
          ))}
        </div>

        {step === "address" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Adresse de livraison</h2>

              {/* Saved Addresses List */}
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-all ${selectedAddressId === addr.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"}`}
                  >
                    <p className="font-semibold text-slate-900">{addr.street}</p>
                    <p className="text-sm text-slate-600">{addr.postalCode} {addr.city}</p>
                    <p className="text-sm text-slate-600 uppercase">{addr.country}</p>
                  </div>
                ))}

                <button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-slate-500 hover:border-primary hover:text-primary transition-colors"
                >
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-sm font-medium">Nouvelle adresse</span>
                </button>
              </div>
            </div>

            {/* New Address Form */}
            {showNewAddressForm && (
              <form onSubmit={handleCreateAddress} className="card p-6 space-y-4 bg-slate-50 border-slate-200">
                <h3 className="font-semibold text-slate-900">Ajouter une nouvelle adresse</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    required placeholder="Rue" value={newAddress.street}
                    onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="col-span-2 rounded-md border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    required placeholder="Code Postal" value={newAddress.postalCode}
                    onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="rounded-md border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    required placeholder="Ville" value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="rounded-md border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    required placeholder="Pays" value={newAddress.country}
                    onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="rounded-md border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Téléphone" value={newAddress.phone}
                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="rounded-md border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowNewAddressForm(false)} className="text-sm text-slate-600 hover:text-slate-900">Annuler</button>
                  <button type="submit" disabled={isLoading} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                    {isLoading ? "Enregistrement..." : "Enregistrer l'adresse"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={handleGoToPayment}
                disabled={!selectedAddressId}
                className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Passer au paiement
              </button>
            </div>
          </div>
        )}

        {step === "payment" && clientSecret && (
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Paiement sécurisé</h2>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <CheckoutForm
                  amount={cartTotal}
                  currency={currency}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep("address")} className="text-slate-600 font-medium hover:text-slate-900">
                ← Retour
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Summary */}
      <div className="lg:col-span-1">
        <div className="card p-6 sticky top-24 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Récapitulatif</h3>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Sous-total</span>
            <span>{(cartTotal / 100).toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-4 border-t border-slate-100">
            <span>Total à payer</span>
            <span>{(cartTotal / 100).toFixed(2)} {currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
