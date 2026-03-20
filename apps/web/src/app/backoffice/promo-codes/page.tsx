"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Tag, Calendar, Users, Percent, DollarSign } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface PromoCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'buy_x_get_y';
    value: number;
    minOrderAmount?: number;
    maxUsages?: number;
    maxUsagesPerUser?: number;
    currentUsages: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
}

interface PaginatedResponse {
    items: PromoCode[];
    total: number;
    page: number;
    totalPages: number;
}

export default function BackofficePromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

    const fetchPromoCodes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`${API_URL}/admin/promo-codes?${params}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch promo codes');
            const data: PaginatedResponse = await res.json();
            setPromoCodes(data.items);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes();
    }, [statusFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) return;

        try {
            const res = await fetch(`${API_URL}/admin/promo-codes/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchPromoCodes();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const isExpired = (validUntil: string) => new Date(validUntil) < new Date();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Codes Promo</h1>
                    <p className="text-muted-foreground">Gérez vos codes promotionnels</p>
                </div>
                <Button onClick={() => { setEditingCode(null); setShowForm(true); }}>
                    <Plus className="size-4 mr-2" />
                    Nouveau Code
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                >
                    Tous
                </Button>
                <Button
                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('active')}
                >
                    Actifs
                </Button>
                <Button
                    variant={statusFilter === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('expired')}
                >
                    Expirés
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : promoCodes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Tag className="size-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun code promo trouvé</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {promoCodes.map(promo => (
                        <Card key={promo.id} className={isExpired(promo.validUntil) ? 'opacity-60' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <code className="px-3 py-1 bg-slate-100 rounded-md font-mono font-bold text-lg">
                                                {promo.code}
                                            </code>
                                            <Badge variant={promo.isActive && !isExpired(promo.validUntil) ? 'default' : 'secondary'}>
                                                {isExpired(promo.validUntil) ? 'Expiré' : promo.isActive ? 'Actif' : 'Inactif'}
                                            </Badge>
                                            <Badge variant="outline">
                                                {promo.type === 'percentage' && <Percent className="size-3 mr-1" />}
                                                {promo.type === 'fixed' && <DollarSign className="size-3 mr-1" />}
                                                {promo.type === 'percentage' ? `${promo.value}%` : `${(promo.value / 100).toFixed(2)}€`}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-4" />
                                                {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-4" />
                                                {promo.currentUsages} utilisations
                                                {promo.maxUsages && ` / ${promo.maxUsages}`}
                                            </span>
                                            {promo.minOrderAmount && (
                                                <span>Min: {(promo.minOrderAmount / 100).toFixed(2)}€</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditingCode(promo); setShowForm(true); }}
                                        >
                                            <Edit2 className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(promo.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Modal would go here - simplified for now */}
            {showForm && (
                <PromoCodeForm
                    editingCode={editingCode}
                    onClose={() => { setShowForm(false); setEditingCode(null); }}
                    onSaved={() => { setShowForm(false); setEditingCode(null); fetchPromoCodes(); }}
                />
            )}
        </div>
    );
}

function PromoCodeForm({
    editingCode,
    onClose,
    onSaved
}: {
    editingCode: PromoCode | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [formData, setFormData] = useState({
        code: editingCode?.code || '',
        type: editingCode?.type || 'percentage',
        value: editingCode?.value || 0,
        minOrderAmount: editingCode?.minOrderAmount || '',
        maxUsages: editingCode?.maxUsages || '',
        maxUsagesPerUser: editingCode?.maxUsagesPerUser || '',
        validFrom: editingCode?.validFrom?.split('T')[0] || new Date().toISOString().split('T')[0],
        validUntil: editingCode?.validUntil?.split('T')[0] || '',
        isActive: editingCode?.isActive ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                code: formData.code,
                type: formData.type,
                value: Number(formData.value),
                minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
                maxUsages: formData.maxUsages ? Number(formData.maxUsages) : undefined,
                maxUsagesPerUser: formData.maxUsagesPerUser ? Number(formData.maxUsagesPerUser) : undefined,
                validFrom: formData.validFrom,
                validUntil: formData.validUntil,
                isActive: formData.isActive,
            };

            const url = editingCode
                ? `${API_URL}/admin/promo-codes/${editingCode.id}`
                : `${API_URL}/admin/promo-codes`;

            const res = await fetch(url, {
                method: editingCode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to save');
            }

            onSaved();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>{editingCode ? 'Modifier' : 'Nouveau'} Code Promo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Code</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="EX: SAVE20"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as any }))}
                                    className="w-full h-10 rounded-md border border-input bg-white px-3"
                                >
                                    <option value="percentage">Pourcentage</option>
                                    <option value="fixed">Montant fixe</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Valeur {formData.type === 'percentage' ? '(%)' : '(cents)'}
                                </label>
                                <Input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData(p => ({ ...p, value: Number(e.target.value) }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Date début</label>
                                <Input
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData(p => ({ ...p, validFrom: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Date fin</label>
                                <Input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData(p => ({ ...p, validUntil: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">Min. commande (cents)</label>
                                <Input
                                    type="number"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData(p => ({ ...p, minOrderAmount: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max. utilisations</label>
                                <Input
                                    type="number"
                                    value={formData.maxUsages}
                                    onChange={(e) => setFormData(p => ({ ...p, maxUsages: e.target.value }))}
                                    placeholder="∞"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max/utilisateur</label>
                                <Input
                                    type="number"
                                    value={formData.maxUsagesPerUser}
                                    onChange={(e) => setFormData(p => ({ ...p, maxUsagesPerUser: e.target.value }))}
                                    placeholder="∞"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                            />
                            <label htmlFor="isActive" className="text-sm">Actif</label>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
