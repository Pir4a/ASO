"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type State = "loading" | "success" | "error";

function ConfirmEmailChangeInner() {
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const [state, setState] = useState<State>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage("Lien invalide : token manquant.");
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
                            : "Token invalide ou expiré.";
                    setState("error");
                    setMessage(msg);
                    return;
                }
                setState("success");
                setMessage(
                    typeof data.email === "string"
                        ? `Votre adresse a été mise à jour : ${data.email}.`
                        : "Votre adresse a été mise à jour.",
                );
            } catch (e) {
                if (cancelled) return;
                setState("error");
                setMessage((e as Error).message || "Erreur réseau.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <main className="mx-auto max-w-lg px-6 py-16">
            <div className="rounded-2xl border border-foreground/10 bg-white p-8">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                    Confirmation de changement d&apos;e-mail
                </h1>

                {state === "loading" && (
                    <p className="mt-4 text-foreground/70">Vérification du lien…</p>
                )}
                {state === "success" && (
                    <>
                        <p className="mt-4 text-emerald-700">{message}</p>
                        <Link
                            href="/profile"
                            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                        >
                            Retour au profil
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
                            Retour au profil
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
