"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SetupForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/profile`, // Redirect is default, but we might want to handle it inline if possible or expect redirect
            },
            redirect: 'if_required'
        });

        if (error) {
            setErrorMessage(error.message || "Une erreur est survenue");
            setLoading(false);
        } else {
            // Success!
            onSuccess();
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <div className="flex justify-end space-x-3">
                <button type="button" onClick={onCancel} disabled={loading} className="text-sm text-slate-600 hover:text-slate-800">
                    Annuler
                </button>
                <button disabled={!stripe || loading} className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-hover disabled:opacity-50">
                    {loading ? 'Enregistrement...' : 'Enregistrer la carte'}
                </button>
            </div>
        </form>
    );
}

export function AddPaymentMethod({ onAdded }: { onAdded: () => void }) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const startSetup = async () => {
        setIsOpen(true);
        // Create Setup Intent
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/intent/setup`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setClientSecret(data.clientSecret);
        } else {
            setIsOpen(false);
            alert("Erreur lors de l'initialisation du paiement");
        }
    };

    if (!isOpen) {
        return (
            <button onClick={startSetup} className="text-primary text-sm font-medium hover:underline">
                + Ajouter une carte
            </button>
        );
    }

    return (
        <div className="border p-4 rounded bg-slate-50 mt-4">
            <h3 className="text-sm font-semibold mb-3">Nouvelle Carte</h3>
            {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm onSuccess={() => { setIsOpen(false); onAdded(); }} onCancel={() => setIsOpen(false)} />
                </Elements>
            ) : (
                <p>Chargement...</p>
            )}
        </div>
    );
}
