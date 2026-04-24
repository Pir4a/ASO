"use client";

import { useState, useEffect } from "react";
import { AddPaymentMethod } from "./AddPaymentMethod";
import { API_URL } from "@/lib/api";

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
}

export function PaymentMethodList() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMethods = async () => {
        try {
            const res = await fetch(`${API_URL}/payment/methods`);
            if (res.ok) {
                setMethods(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce moyen de paiement ?")) return;
        const res = await fetch(`${API_URL}/payment/methods/${id}`, {
            method: "DELETE"
        });
        if (res.ok) {
            fetchMethods();
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Cartes enregistrées</h3>
            {methods.length === 0 ? (
                <p className="text-foreground/60 text-sm">Aucun moyen de paiement enregistré.</p>
            ) : (
                <div className="space-y-2">
                    {methods.map(pm => (
                        <div key={pm.id} className="flex justify-between items-center border p-3 rounded bg-white">
                            <div className="flex items-center space-x-3">
                                {/* Simple Icon Placeholder */}
                                <div className="w-8 h-5 bg-foreground/10 rounded"></div>
                                <div>
                                    <p className="text-sm font-medium capitalize">{pm.brand} •••• {pm.last4}</p>
                                    <p className="text-xs text-foreground/60">Exp: {pm.expMonth}/{pm.expYear}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(pm.id)} className="text-error text-xs hover:underline">
                                Supprimer
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
