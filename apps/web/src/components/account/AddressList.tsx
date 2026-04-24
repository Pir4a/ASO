"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "./AddressForm";
import { authFetch } from "@/lib/auth";

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
    const [error, setError] = useState<string | null>(null);

    const fetchAddresses = async () => {
        try {
            const res = await authFetch("/profile/addresses");
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
        setError(null);
        const res = await authFetch("/profile/addresses", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setIsCreating(false);
            fetchAddresses();
        } else {
            const body = await res.json().catch(() => ({}));
            const msg = body.message || `Failed to create address (${res.status})`;
            setError(msg);
            throw new Error(msg);
        }
    };

    const handleUpdate = async (data: Partial<Address>) => {
        if (!editingAddress) return;
        const res = await authFetch(`/profile/addresses/${editingAddress.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setEditingAddress(null);
            fetchAddresses();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        const res = await authFetch(`/profile/addresses/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchAddresses();
        }
    };

    if (loading) return <div>Loading...</div>;

    if (isCreating) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-medium mb-4">New Address</h3>
                {error && (
                    <p className="mb-3 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                        {error}
                    </p>
                )}
                <AddressForm onSubmit={handleCreate} onCancel={() => { setError(null); setIsCreating(false); }} />
            </div>
        );
    }

    if (editingAddress) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-medium mb-4">Edit Address</h3>
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
                <h2 className="text-xl font-semibold">My Addresses</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover text-sm"
                >
                    Add
                </button>
            </div>

            {addresses.length === 0 ? (
                <p className="text-foreground/60 text-sm">No saved addresses.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="border p-4 rounded-lg relative group bg-white shadow-sm">
                            <div className="text-sm">
                                <p className="font-medium">{addr.street}</p>
                                <p>{addr.city}, {addr.postalCode}</p>
                                <p>{addr.country}</p>
                                {addr.phone && <p className="text-foreground/60 text-xs mt-1">{addr.phone}</p>}
                            </div>
                            <div className="mt-3 flex space-x-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingAddress(addr)} className="text-primary hover:underline">Edit</button>
                                <button onClick={() => handleDelete(addr.id)} className="text-error hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
