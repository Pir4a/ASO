"use client";

import { useCallback, useEffect, useState } from "react";
import { AddressForm, type AddressFormData } from "./AddressForm";
import { authFetch } from "@/lib/auth";
import { useLocale } from "@/context/LocaleContext";

interface Address extends AddressFormData {
    id: string;
}

export function AddressList() {
    const locale = useLocale();
    const copy = ADDRESS_LIST_COPY[locale];
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Address | null>(null);
    const [creating, setCreating] = useState(false);
    const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);

    const flashAndClear = (kind: "success" | "error", text: string) => {
        setFlash({ kind, text });
        window.setTimeout(() => setFlash(null), 3500);
    };

    const fetchAddresses = useCallback(async () => {
        try {
            const res = await authFetch("/profile/addresses");
            if (res.ok) {
                setAddresses((await res.json()) as Address[]);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAddresses();
    }, [fetchAddresses]);

    const handleCreate = async (data: AddressFormData) => {
        const res = await authFetch("/profile/addresses", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            const msg = typeof body.message === "string" ? body.message : copy.createFailed;
            flashAndClear("error", msg);
            throw new Error(msg);
        }
        setCreating(false);
        await fetchAddresses();
        flashAndClear("success", copy.created);
    };

    const handleUpdate = async (data: AddressFormData) => {
        if (!editing) return;
        const res = await authFetch(`/profile/addresses/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            const msg = typeof body.message === "string" ? body.message : copy.updateFailed;
            flashAndClear("error", msg);
            throw new Error(msg);
        }
        setEditing(null);
        await fetchAddresses();
        flashAndClear("success", copy.updated);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(copy.deleteConfirm)) return;
        const res = await authFetch(`/profile/addresses/${id}`, { method: "DELETE" });
        if (res.ok) {
            await fetchAddresses();
            flashAndClear("success", copy.deleted);
        } else {
            flashAndClear("error", copy.deleteFailed);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-10 text-center text-sm text-foreground/55">
                {copy.loading}
            </div>
        );
    }

    if (creating) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background/40 p-5">
                <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                    {copy.newAddress}
                </p>
                <AddressForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
            </div>
        );
    }

    if (editing) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background/40 p-5">
                <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                    {copy.editAddress}
                </p>
                <AddressForm
                    initialData={editing}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-6 py-10 text-center text-sm text-foreground/55">
                    {copy.empty}
                </div>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2" role="list">
                    {addresses.map((a) => {
                        const fullName = [a.firstName, a.lastName].filter(Boolean).join(" ");
                        return (
                            <li
                                key={a.id}
                                className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-white p-4"
                            >
                                <div className="space-y-0.5 text-[13.5px] text-foreground">
                                    {fullName && (
                                        <p className="font-heading font-semibold">{fullName}</p>
                                    )}
                                    <p>{a.street}</p>
                                    {a.address2 && <p className="text-foreground/65">{a.address2}</p>}
                                    <p>
                                        <span className="tabular-nums">{a.postalCode}</span> {a.city}
                                        {a.region ? `, ${a.region}` : ""}
                                    </p>
                                    <p className="text-foreground/65">{a.country}</p>
                                    {a.phone && (
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-foreground/65">
                                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3 w-3 text-primary">
                                                <path d="M2 3a1 1 0 0 1 1-1h2l1 3-2 1c0 2 1 3 3 3l1-2 3 1v2a1 1 0 0 1-1 1h-1A8 8 0 0 1 2 4V3Z" />
                                            </svg>
                                            {a.phone}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-auto flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(a)}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 bg-white px-3 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
                                    >
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                                            <path d="M3 13h3L13 6l-3-3L3 10v3z" />
                                            <path d="m9 4 3 3" />
                                        </svg>
                                        {copy.edit}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(a.id)}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error/25 bg-white px-3 text-[12px] font-semibold text-error transition hover:bg-error/10"
                                    >
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                                            <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-5 0v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
                                        </svg>
                                        {copy.delete}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button
                type="button"
                onClick={() => setCreating(true)}
                style={{ color: "#fff" }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold transition hover:bg-primary-hover"
            >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="M8 3v10M3 8h10" />
                </svg>
                {copy.add}
            </button>

            {flash && (
                <div
                    role="status"
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] ${
                        flash.kind === "success"
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-error/30 bg-error/10 text-error"
                    }`}
                >
                    {flash.kind === "success" ? (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d="m3 8 3.5 3.5L13 5" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                            <circle cx="8" cy="8" r="6" />
                            <path d="m4.5 4.5 7 7" />
                        </svg>
                    )}
                    {flash.text}
                </div>
            )}
        </div>
    );
}

const ADDRESS_LIST_COPY = {
    fr: {
        createFailed: "Création impossible.",
        created: "Adresse ajoutée.",
        updateFailed: "Mise à jour impossible.",
        updated: "Adresse mise à jour.",
        deleteConfirm: "Supprimer cette adresse ?",
        deleted: "Adresse supprimée.",
        deleteFailed: "Suppression impossible.",
        loading: "Chargement…",
        newAddress: "Nouvelle adresse",
        editAddress: "Modifier l'adresse",
        empty: "Aucune adresse enregistrée.",
        edit: "Modifier",
        delete: "Supprimer",
        add: "Ajouter une adresse",
    },
    en: {
        createFailed: "Could not create address.",
        created: "Address added.",
        updateFailed: "Could not update address.",
        updated: "Address updated.",
        deleteConfirm: "Delete this address?",
        deleted: "Address deleted.",
        deleteFailed: "Could not delete address.",
        loading: "Loading…",
        newAddress: "New address",
        editAddress: "Edit address",
        empty: "No saved addresses.",
        edit: "Edit",
        delete: "Delete",
        add: "Add an address",
    },
    ar: {
        createFailed: "تعذّر إنشاء العنوان.",
        created: "تمت إضافة العنوان.",
        updateFailed: "تعذّر تحديث العنوان.",
        updated: "تم تحديث العنوان.",
        deleteConfirm: "حذف هذا العنوان؟",
        deleted: "تم حذف العنوان.",
        deleteFailed: "تعذّر حذف العنوان.",
        loading: "جارٍ التحميل…",
        newAddress: "عنوان جديد",
        editAddress: "تعديل العنوان",
        empty: "لا توجد عناوين محفوظة.",
        edit: "تعديل",
        delete: "حذف",
        add: "إضافة عنوان",
    },
    he: {
        createFailed: "לא ניתן ליצור כתובת.",
        created: "הכתובת נוספה.",
        updateFailed: "לא ניתן לעדכן כתובת.",
        updated: "הכתובת עודכנה.",
        deleteConfirm: "למחוק את הכתובת הזו?",
        deleted: "הכתובת נמחקה.",
        deleteFailed: "לא ניתן למחוק כתובת.",
        loading: "טוען…",
        newAddress: "כתובת חדשה",
        editAddress: "עריכת כתובת",
        empty: "אין כתובות שמורות.",
        edit: "עריכה",
        delete: "מחיקה",
        add: "הוספת כתובת",
    },
} as const;
