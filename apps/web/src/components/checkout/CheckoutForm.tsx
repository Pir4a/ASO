"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
    amount: number;
    currency: string;
    onSuccess: (paymentIntentId: string) => void;
}

export function CheckoutForm({ amount, currency, onSuccess }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required, but we handle "if_required" flow or redirect
                // For simplicity in this SPA, we might not trigger redirect if 3DS is not needed
                // But generally Stripe redirects.
                return_url: `${window.location.origin}/checkout/result`,
            },
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message || "Une erreur est survenue.");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id);
        } else {
            setMessage("Statut inattendu.");
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {message && <div className="text-red-500 text-sm">{message}</div>}
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full rounded-md bg-primary px-8 py-3 text-base font-bold text-white shadow-lg hover:bg-primary-hover hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
                {isLoading ? "Traitement..." : `Payer ${(amount / 100).toFixed(2)} ${currency}`}
            </button>
        </form>
    );
}
