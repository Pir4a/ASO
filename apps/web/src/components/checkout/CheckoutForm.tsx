"use client";

import { useState, type ReactNode } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
    amount: number;
    currency: string;
    onSuccess: (paymentIntentId: string) => void;
    /**
     * "input" → show <PaymentElement /> and a button that validates the form
     *           and asks the parent to move to the review step.
     * "review" → keep Stripe Elements mounted (so PaymentElement state is
     *           preserved) but hide them; render the supplied `reviewContent`
     *           and a final "Confirmer l'achat" button that actually calls
     *           stripe.confirmPayment.
     *
     * We keep a single <CheckoutForm /> mounted across both modes so the
     * user's payment details entered in the PaymentElement are not lost
     * when they navigate to the review screen and back.
     */
    mode: "input" | "review";
    onValidated: () => void;
    onBackToInput: () => void;
    reviewContent: ReactNode;
    confirmLabel: string;
    confirmingLabel: string;
    continueLabel: string;
    backLabel: string;
}

export function CheckoutForm({
    amount,
    currency,
    onSuccess,
    mode,
    onValidated,
    onBackToInput,
    reviewContent,
    confirmLabel,
    confirmingLabel,
    continueLabel,
    backLabel,
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        if (mode === "input") {
            // Validate the PaymentElement inputs (e.g., required card number)
            // before moving the user to the review screen. submit() surfaces
            // any field-level errors in-place without charging the card.
            setIsLoading(true);
            setMessage(null);
            const { error } = await elements.submit();
            setIsLoading(false);
            if (error) {
                setMessage(error.message ?? "Veuillez compléter les informations de paiement.");
                return;
            }
            onValidated();
            return;
        }

        // mode === "review": actually charge the card.
        setIsLoading(true);
        setMessage(null);
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
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

    const isReview = mode === "review";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Keep PaymentElement mounted on the review step (hidden) so the
                user's entries are preserved when they click "Modifier". */}
            <div className={isReview ? "hidden" : ""} aria-hidden={isReview}>
                <PaymentElement />
            </div>

            {isReview && reviewContent}

            {message && <div className="text-error text-sm">{message}</div>}

            {isReview ? (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={onBackToInput}
                        disabled={isLoading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-white px-5 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d="M13 8H3m3-3-3 3 3 3" />
                        </svg>
                        {backLabel}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !stripe || !elements}
                        id="submit"
                        style={{ color: "#fff" }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[14px] font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading
                            ? confirmingLabel
                            : `${confirmLabel} · ${(amount / 100).toFixed(2)} ${currency}`}
                    </button>
                </div>
            ) : (
                <button
                    type="submit"
                    disabled={isLoading || !stripe || !elements}
                    id="continue-to-review"
                    style={{ color: "#fff" }}
                    className="w-full rounded-md bg-primary px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-hover disabled:opacity-50"
                >
                    {isLoading ? "..." : continueLabel}
                </button>
            )}
        </form>
    );
}
