"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
import { useT } from "@/context/LocaleContext";

function ResetPasswordContent() {
    const t = useT();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError(t("reset.errInvalidLink"));
            return;
        }
        if (password.length < 8) {
            setError(t("reset.errPasswordTooShort"));
            return;
        }
        if (password !== confirm) {
            setError(t("reset.errPasswordMismatch"));
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                router.push(`/login?message=${encodeURIComponent(t("reset.successQueryMsg"))}`);
            }, 2500);
        } catch (e) {
            setError(e instanceof Error ? e.message : t("reset.errGeneric"));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto max-w-md space-y-4">
                <div className="card p-6 space-y-3 text-center">
                    <h1 className="text-2xl font-semibold text-success">{t("reset.successTitle")}</h1>
                    <p className="text-sm text-foreground/70">{t("reset.successBody")}</p>
                    <Link href="/login" className="inline-block text-sm text-primary hover:text-primary-hover">
                        {t("reset.successCta")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md space-y-4">
            <div className="card p-6 space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">{t("reset.title")}</h1>
                <p className="text-sm text-foreground/70">{t("reset.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-3 p-6">
                <input
                    type="password"
                    placeholder={t("reset.newPasswordPlaceholder")}
                    className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                />
                <input
                    type="password"
                    placeholder={t("reset.confirmPlaceholder")}
                    className="w-full rounded-md border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                />

                {error ? (
                    <p className="text-sm text-error bg-error/10 p-3 rounded-md">{error}</p>
                ) : null}

                <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
                >
                    {loading ? t("reset.submitting") : t("reset.submit")}
                </button>
                <Link href="/login" className="block text-center text-sm text-primary hover:text-primary-hover">
                    {t("common.backToLogin")}
                </Link>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading…</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
