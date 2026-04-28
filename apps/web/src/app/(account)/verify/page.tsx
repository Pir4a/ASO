"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";

type VerifyErrorKind = "expired" | "invalid" | "generic";

function VerifyContent() {
    const locale = useLocale();
    const copy = VERIFY_COPY[locale];
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorKind, setErrorKind] = useState<VerifyErrorKind>("generic");
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/verify?token=${token}`);
                if (!res.ok) {
                    const payload = (await res.json().catch(() => ({}))) as {
                        code?: string;
                        message?: string | string[];
                    };
                    // The use-case throws with `{ message, code }`; Nest's
                    // exception filter wraps it under `message` (the inner
                    // object). Normalize either shape so the front-end stays
                    // tolerant of refactors on the backend.
                    const messageField = Array.isArray(payload.message)
                        ? payload.message[0]
                        : payload.message;
                    const code =
                        payload.code ??
                        (typeof messageField === "object" && messageField !== null
                            ? (messageField as { code?: string }).code
                            : undefined) ??
                        (typeof messageField === "string" ? messageField : undefined);
                    if (code === "VERIFY_EMAIL_TOKEN_EXPIRED") {
                        setErrorKind("expired");
                    } else if (code === "VERIFY_EMAIL_TOKEN_INVALID") {
                        setErrorKind("invalid");
                    } else {
                        setErrorKind("generic");
                    }
                    throw new Error("Verification failed");
                }
                setStatus("success");
                // Redirect to login after 3 seconds
                setTimeout(
                    () =>
                        router.push(
                            `/login?message=${encodeURIComponent(copy.redirectMessage)}`,
                        ),
                    3000,
                );
            } catch {
                setStatus("error");
            }
        };

        verify();
    }, [token, router]);

    if (status === "loading") {
        return (
            <div className="text-center p-8 space-y-4">
                <h2 className="text-xl font-semibold">{copy.loadingTitle}</h2>
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="text-center p-8 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-success">{copy.successTitle}</h2>
                <p className="text-foreground/70">{copy.successBody}</p>
                <Link href="/login" className="inline-block text-primary hover:underline">
                    {copy.goLoginNow}
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center p-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
                <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h2 className="text-xl font-semibold text-error">{copy.errorTitle}</h2>
            <p className="text-foreground/70">
                {errorKind === "expired"
                    ? copy.errorExpired
                    : errorKind === "invalid"
                      ? copy.errorInvalid
                      : copy.errorGeneric}
            </p>
            <Link href="/signup" className="inline-block text-primary hover:underline">
                {copy.backToSignup}
            </Link>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyContent />
        </Suspense>
    )
}

const VERIFY_COPY = {
    fr: {
        redirectMessage: "Compte vérifié ! Vous pouvez vous connecter.",
        loadingTitle: "Vérification en cours...",
        successTitle: "Compte vérifié !",
        successBody: "Vous allez être redirigé vers la page de connexion.",
        goLoginNow: "Aller à la connexion immédiatement",
        errorTitle: "Erreur de vérification",
        errorExpired: "Ce lien de vérification a expiré. Recréez un compte pour recevoir un nouveau lien.",
        errorInvalid: "Ce lien de vérification est invalide.",
        errorGeneric: "Le lien est invalide ou a expiré.",
        backToSignup: "Retour à l'inscription",
    },
    en: {
        redirectMessage: "Account verified! You can now sign in.",
        loadingTitle: "Verifying...",
        successTitle: "Account verified!",
        successBody: "You will be redirected to the sign-in page.",
        goLoginNow: "Go to sign-in now",
        errorTitle: "Verification error",
        errorExpired: "This verification link has expired. Create an account again to receive a new link.",
        errorInvalid: "This verification link is invalid.",
        errorGeneric: "The link is invalid or expired.",
        backToSignup: "Back to sign up",
    },
    ar: {
        redirectMessage: "تم التحقق من الحساب! يمكنك تسجيل الدخول الآن.",
        loadingTitle: "جارٍ التحقق...",
        successTitle: "تم التحقق من الحساب!",
        successBody: "سيتم تحويلك إلى صفحة تسجيل الدخول.",
        goLoginNow: "الانتقال إلى تسجيل الدخول الآن",
        errorTitle: "خطأ في التحقق",
        errorExpired: "انتهت صلاحية رابط التحقق. أنشئ حسابًا مرة أخرى للحصول على رابط جديد.",
        errorInvalid: "رابط التحقق غير صالح.",
        errorGeneric: "الرابط غير صالح أو منتهي الصلاحية.",
        backToSignup: "العودة إلى التسجيل",
    },
    he: {
        redirectMessage: "החשבון אומת! אפשר להתחבר עכשיו.",
        loadingTitle: "מאמת...",
        successTitle: "החשבון אומת!",
        successBody: "תועברו לעמוד ההתחברות.",
        goLoginNow: "מעבר להתחברות עכשיו",
        errorTitle: "שגיאת אימות",
        errorExpired: "תוקף קישור האימות פג. צרו חשבון מחדש כדי לקבל קישור חדש.",
        errorInvalid: "קישור האימות אינו תקין.",
        errorGeneric: "הקישור אינו תקין או שפג תוקפו.",
        backToSignup: "חזרה להרשמה",
    },
} as const;
