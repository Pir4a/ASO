"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type VerifyErrorKind = "expired" | "invalid" | "generic";

function VerifyContent() {
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
                        message?: string | string[];
                    };
                    const message = Array.isArray(payload.message)
                        ? payload.message[0]
                        : payload.message;
                    if (message === "VERIFY_EMAIL_TOKEN_EXPIRED") {
                        setErrorKind("expired");
                    } else if (message === "VERIFY_EMAIL_TOKEN_INVALID") {
                        setErrorKind("invalid");
                    } else {
                        setErrorKind("generic");
                    }
                    throw new Error("Verification failed");
                }
                setStatus("success");
                // Redirect to login after 3 seconds
                setTimeout(() => router.push("/login?message=Compte vérifié ! Vous pouvez vous connecter."), 3000);
            } catch {
                setStatus("error");
            }
        };

        verify();
    }, [token, router]);

    if (status === "loading") {
        return (
            <div className="text-center p-8 space-y-4">
                <h2 className="text-xl font-semibold">Vérification en cours...</h2>
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
                <h2 className="text-xl font-semibold text-success">Compte vérifié !</h2>
                <p className="text-foreground/70">Vous allez être redirigé vers la page de connexion.</p>
                <Link href="/login" className="inline-block text-primary hover:underline">
                    Aller à la connexion immédiatement
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
            <h2 className="text-xl font-semibold text-error">Erreur de vérification</h2>
            <p className="text-foreground/70">
                {errorKind === "expired"
                    ? "Ce lien de vérification a expiré. Recréez un compte pour recevoir un nouveau lien."
                    : errorKind === "invalid"
                      ? "Ce lien de vérification est invalide."
                      : "Le lien est invalide ou a expiré."}
            </p>
            <Link href="/signup" className="inline-block text-primary hover:underline">
                Retour à l&apos;inscription
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
