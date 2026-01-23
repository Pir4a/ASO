"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Edit2, Check, X } from "lucide-react";

interface Address {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
}

interface AddressSelectorProps {
    addresses: Address[];
    selectedAddressId: string | null;
    onSelect: (addressId: string) => void;
    onAddNew: (address: Omit<Address, 'id'>) => Promise<void>;
    isLoading?: boolean;
}

export function AddressSelector({
    addresses,
    selectedAddressId,
    onSelect,
    onAddNew,
    isLoading
}: AddressSelectorProps) {
    const [showNewForm, setShowNewForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        postalCode: '',
        country: 'France',
        phone: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmitNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.street || !newAddress.city || !newAddress.postalCode) return;

        setIsSaving(true);
        try {
            await onAddNew(newAddress);
            setShowNewForm(false);
            setNewAddress({ street: '', city: '', postalCode: '', country: 'France', phone: '' });
        } catch (error) {
            console.error('Failed to add address:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Address List */}
            <div className="space-y-3">
                {addresses.length === 0 && !showNewForm && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <MapPin className="size-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-muted-foreground mb-3">Aucune adresse enregistrée</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewForm(true)}
                        >
                            <Plus className="size-4 mr-1.5" />
                            Ajouter une adresse
                        </Button>
                    </div>
                )}

                {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;

                    return (
                        <button
                            key={address.id}
                            onClick={() => onSelect(address.id)}
                            disabled={isLoading}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border-2 transition-all",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                {/* Radio indicator */}
                                <div className={cn(
                                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                    isSelected
                                        ? "border-primary bg-primary"
                                        : "border-slate-300"
                                )}>
                                    {isSelected && <Check className="size-3 text-white" />}
                                </div>

                                {/* Address details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900">{address.street}</p>
                                    <p className="text-sm text-slate-600">
                                        {address.postalCode} {address.city}, {address.country}
                                    </p>
                                    {address.phone && (
                                        <p className="text-sm text-slate-500 mt-1">
                                            Tél: {address.phone}
                                        </p>
                                    )}
                                </div>

                                {/* Default badge */}
                                {address.isDefault && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                        Par défaut
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Add New Address Button */}
            {addresses.length > 0 && !showNewForm && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewForm(true)}
                    className="w-full"
                >
                    <Plus className="size-4 mr-1.5" />
                    Ajouter une nouvelle adresse
                </Button>
            )}

            {/* New Address Form */}
            {showNewForm && (
                <form
                    onSubmit={handleSubmitNew}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Nouvelle adresse</h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewForm(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <div>
                        <Input
                            placeholder="Adresse (rue, numéro)"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress(p => ({ ...p, street: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            placeholder="Code postal"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress(p => ({ ...p, postalCode: e.target.value }))}
                            required
                        />
                        <Input
                            placeholder="Ville"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            placeholder="Pays"
                            value={newAddress.country}
                            onChange={(e) => setNewAddress(p => ({ ...p, country: e.target.value }))}
                            required
                        />
                        <Input
                            placeholder="Téléphone (optionnel)"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewForm(false)}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1">
                            {isSaving ? "Ajout..." : "Ajouter"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
