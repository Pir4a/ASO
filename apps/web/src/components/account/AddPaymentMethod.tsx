"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { authFetch } from "@/lib/auth";
import { useT } from "@/context/LocaleContext";

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SetupForm({
    onSuccess,
    onCancel,
}: {
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const t = useT();
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        setError(null);

        const { error: stripeErr } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/profile`,
            },
            redirect: "if_required",
        });

        if (stripeErr) {
            setError(stripeErr.message || t("common.unexpectedError"));
            setLoading(false);
        } else {
            onSuccess();
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-foreground/10 bg-white p-4">
                <PaymentElement />
            </div>
            {error && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[13px] text-error"
                >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                        <circle cx="8" cy="8" r="6" />
                        <path d="m4.5 4.5 7 7" />
                    </svg>
                    {error}
                </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/15 bg-white px-4 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {t("common.cancel")}
                </button>
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    style={{ color: "#fff" }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t("common.saving")}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                                <path d="m3 8 3.5 3.5L13 5" />
                            </svg>
                            {t("profile.payments.saveCard")}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export function AddPaymentMethod({ onAdded }: { onAdded: () => void }) {
    const t = useT();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch("/payment/intent/setup", { method: "POST" });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                const msg =
                    typeof body?.message === "string"
                        ? body.message
                        : t("profile.payments.setupError");
                throw new Error(msg);
            }
            const data = (await res.json()) as { clientSecret: string };
            setClientSecret(data.clientSecret);
            setIsOpen(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : t("common.unexpectedError"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={startSetup}
                    disabled={loading}
                    style={{ color: "#fff" }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t("profile.payments.preparing")}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                                <path d="M8 3v10M3 8h10" />
                            </svg>
                            {t("profile.payments.addCard")}
                        </>
                    )}
                </button>
                {error && (
                    <p
                        role="alert"
                        className="inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2 text-[12.5px] text-error"
                    >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                            <circle cx="8" cy="8" r="6" />
                            <path d="m4.5 4.5 7 7" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-foreground/10 bg-background/40 p-5">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                {t("profile.payments.newCard")}
            </p>
            {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm
                        onSuccess={() => {
                            setIsOpen(false);
                            setClientSecret(null);
                            onAdded();
                        }}
                        onCancel={() => {
                            setIsOpen(false);
                            setClientSecret(null);
                        }}
                    />
                </Elements>
            ) : (
                <p className="text-sm text-foreground/55">{t("common.loading")}</p>
            )}
        </div>
    );
}
