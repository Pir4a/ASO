"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type State = "loading" | "success" | "error";

function ConfirmEmailChangeInner() {
    const locale = useLocale();
    const copy = EMAIL_CHANGE_COPY[locale];
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const [state, setState] = useState<State>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage(copy.missingToken);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `${API_URL}/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
                );
                const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                if (cancelled) return;
                if (!res.ok) {
                    const msg =
                        typeof data?.message === "string"
                            ? data.message
                            : copy.invalidToken;
                    setState("error");
                    setMessage(msg);
                    return;
                }
                setState("success");
                setMessage(
                    typeof data.email === "string"
                        ? copy.successWithEmail(data.email)
                        : copy.successWithoutEmail,
                );
            } catch (e) {
                if (cancelled) return;
                setState("error");
                setMessage((e as Error).message || copy.networkError);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, copy]);

    return (
        <main className="mx-auto max-w-lg px-6 py-16">
            <div className="rounded-2xl border border-foreground/10 bg-white p-8">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                    {copy.title}
                </h1>

                {state === "loading" && (
                    <p className="mt-4 text-foreground/70">{copy.loading}</p>
                )}
                {state === "success" && (
                    <>
                        <p className="mt-4 text-emerald-700">{message}</p>
                        <Link
                            href="/profile"
                            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                        >
                            {copy.backToProfile}
                        </Link>
                    </>
                )}
                {state === "error" && (
                    <>
                        <p className="mt-4 text-rose-700">{message}</p>
                        <Link
                            href="/profile"
                            className="mt-6 inline-flex items-center rounded-md border border-foreground/15 px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5"
                        >
                            {copy.backToProfile}
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}

export default function ConfirmEmailChangePage() {
    return (
        <Suspense
            fallback={
                <main className="mx-auto max-w-lg px-6 py-16">
                    <p className="text-foreground/70">Chargement…</p>
                </main>
            }
        >
            <ConfirmEmailChangeInner />
        </Suspense>
    );
}

const EMAIL_CHANGE_COPY = {
    fr: {
        title: "Confirmation de changement d'e-mail",
        missingToken: "Lien invalide : token manquant.",
        invalidToken: "Token invalide ou expiré.",
        successWithEmail: (email: string) => `Votre adresse a été mise à jour : ${email}.`,
        successWithoutEmail: "Votre adresse a été mise à jour.",
        networkError: "Erreur réseau.",
        loading: "Vérification du lien…",
        backToProfile: "Retour au profil",
    },
    en: {
        title: "Email change confirmation",
        missingToken: "Invalid link: missing token.",
        invalidToken: "Invalid or expired token.",
        successWithEmail: (email: string) => `Your email was updated: ${email}.`,
        successWithoutEmail: "Your email was updated.",
        networkError: "Network error.",
        loading: "Verifying link…",
        backToProfile: "Back to profile",
    },
    ar: {
        title: "تأكيد تغيير البريد الإلكتروني",
        missingToken: "رابط غير صالح: الرمز مفقود.",
        invalidToken: "رمز غير صالح أو منتهي الصلاحية.",
        successWithEmail: (email: string) => `تم تحديث بريدك الإلكتروني: ${email}.`,
        successWithoutEmail: "تم تحديث بريدك الإلكتروني.",
        networkError: "خطأ في الشبكة.",
        loading: "جارٍ التحقق من الرابط…",
        backToProfile: "العودة إلى الملف الشخصي",
    },
    he: {
        title: "אישור שינוי אימייל",
        missingToken: "קישור לא תקין: חסר טוקן.",
        invalidToken: "טוקן לא תקין או שפג תוקפו.",
        successWithEmail: (email: string) => `כתובת האימייל עודכנה: ${email}.`,
        successWithoutEmail: "כתובת האימייל עודכנה.",
        networkError: "שגיאת רשת.",
        loading: "מאמת את הקישור…",
        backToProfile: "חזרה לפרופיל",
    },
} as const;
