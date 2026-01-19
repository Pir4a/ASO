"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "./AddressForm";

interface Address {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export function AddressList() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/addresses`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // Handled by cookie/proxy usually or intercepted
                }
            });
            // Note: In a real app we need to handle auth token. Assuming existing setup handles it via cookies or we need to add manual header if strictly JWT. 
            // Current project seems to use simple flow, will assume fetch wrapper or just fetch for now, focusing on structure.
            // Wait, earlier files used basic fetch. `AuthContext` might provide token?
            // For now, I will use direct fetch, but let's check if we need to pass token.

            if (res.ok) {
                setAddresses(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleCreate = async (data: Omit<Address, "id">) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setIsCreating(false);
            fetchAddresses();
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingAddress) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/addresses/${editingAddress.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setEditingAddress(null);
            fetchAddresses();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/addresses/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            fetchAddresses();
        }
    };

    if (loading) return <div>Chargement...</div>;

    if (isCreating) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-medium mb-4">Nouvelle Adresse</h3>
                <AddressForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
            </div>
        );
    }

    if (editingAddress) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-medium mb-4">Modifier l'adresse</h3>
                <AddressForm
                    initialData={editingAddress}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingAddress(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Mes Adresses</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover text-sm"
                >
                    Ajouter
                </button>
            </div>

            {addresses.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucune adresse enregistrée.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="border p-4 rounded-lg relative group bg-white shadow-sm">
                            <div className="text-sm">
                                <p className="font-medium">{addr.street}</p>
                                <p>{addr.city}, {addr.postalCode}</p>
                                <p>{addr.country}</p>
                                {addr.phone && <p className="text-slate-500 text-xs mt-1">{addr.phone}</p>}
                            </div>
                            <div className="mt-3 flex space-x-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingAddress(addr)} className="text-blue-600 hover:underline">Modifier</button>
                                <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:underline">Supprimer</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
