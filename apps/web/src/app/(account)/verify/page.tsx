"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify?token=${token}`);
                if (!res.ok) throw new Error("Verification failed");
                setStatus("success");
                // Redirect to login after 3 seconds
                setTimeout(() => router.push("/login?message=Compte vérifié ! Vous pouvez vous connecter."), 3000);
            } catch (e) {
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
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-600">Compte vérifié !</h2>
                <p className="text-slate-600">Vous allez être redirigé vers la page de connexion.</p>
                <Link href="/login" className="inline-block text-primary hover:underline">
                    Aller à la connexion immédiatement
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center p-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Erreur de vérification</h2>
            <p className="text-slate-600">Le lien est invalide ou a expiré.</p>
            <Link href="/signup" className="inline-block text-primary hover:underline">
                Retour à l'inscription
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
