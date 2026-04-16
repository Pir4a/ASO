"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "./AddressForm";
import { API_URL } from "@/lib/api";

interface Address {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
}

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export function AddressList() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${API_URL}/profile/addresses`, {
                headers: getAuthHeaders(),
            });
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
        const res = await fetch(`${API_URL}/profile/addresses`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setIsCreating(false);
            fetchAddresses();
        } else {
            throw new Error("Failed to create address");
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingAddress) return;
        const res = await fetch(`${API_URL}/profile/addresses/${editingAddress.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (res.ok) {
            setEditingAddress(null);
            fetchAddresses();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        const res = await fetch(`${API_URL}/profile/addresses/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        if (res.ok) {
            fetchAddresses();
        }
    };

    if (loading) return <div>Loading...</div>;

    if (isCreating) {
        return (
            <div className="card p-4">
                <h3 className="text-lg font-medium mb-4">New Address</h3>
                <AddressForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
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
                <p className="text-slate-500 text-sm">No saved addresses.</p>
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
                                <button onClick={() => setEditingAddress(addr)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(addr.id)} className="text-red-600 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
