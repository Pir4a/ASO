"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/context/LocaleContext";
import { sanitizePhone } from "@/lib/phone";

export interface AddressFormData {
    id?: string;
    firstName?: string;
    lastName?: string;
    street: string;
    address2?: string;
    city: string;
    region?: string;
    postalCode: string;
    country: string;
    phone?: string;
}

interface AddressFormProps {
    initialData?: AddressFormData;
    onSubmit: (data: AddressFormData) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
}

const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-foreground/45 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
const labelCls =
    "mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-foreground/65";

export function AddressForm({
    initialData,
    onSubmit,
    onCancel,
    submitLabel,
}: AddressFormProps) {
    const t = useT();
    const [data, setData] = useState<AddressFormData>({
        firstName: initialData?.firstName ?? "",
        lastName: initialData?.lastName ?? "",
        street: initialData?.street ?? "",
        address2: initialData?.address2 ?? "",
        city: initialData?.city ?? "",
        region: initialData?.region ?? "",
        postalCode: initialData?.postalCode ?? "",
        country: initialData?.country ?? "France",
        phone: initialData?.phone ?? "",
    });
    const [loading, setLoading] = useState(false);
    const set = <K extends keyof AddressFormData>(key: K, value: AddressFormData[K]) =>
        setData((p) => ({ ...p, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(data);
        } finally {
            setLoading(false);
        }
    };

    const resolvedSubmitLabel = submitLabel ?? t("common.save");

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="addr-fn" className={labelCls}>{t("address.firstName")}</label>
                <input
                    id="addr-fn"
                    required
                    value={data.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-ln" className={labelCls}>{t("address.lastName")}</label>
                <input
                    id="addr-ln"
                    required
                    value={data.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-street" className={labelCls}>{t("address.street")}</label>
                <input
                    id="addr-street"
                    required
                    placeholder={t("address.streetPlaceholder")}
                    value={data.street}
                    onChange={(e) => set("street", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-2" className={labelCls}>
                    {t("address.address2")} <span className="font-normal lowercase tracking-normal text-foreground/45">{t("address.optional")}</span>
                </label>
                <input
                    id="addr-2"
                    placeholder={t("address.address2Placeholder")}
                    value={data.address2}
                    onChange={(e) => set("address2", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-postal" className={labelCls}>{t("address.postalCode")}</label>
                <input
                    id="addr-postal"
                    required
                    inputMode="numeric"
                    value={data.postalCode}
                    onChange={(e) => set("postalCode", e.target.value)}
                    className={`${inputCls} font-mono tabular-nums`}
                />
            </div>
            <div>
                <label htmlFor="addr-city" className={labelCls}>{t("address.city")}</label>
                <input
                    id="addr-city"
                    required
                    value={data.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-region" className={labelCls}>
                    {t("address.region")} <span className="font-normal lowercase tracking-normal text-foreground/45">{t("address.optional")}</span>
                </label>
                <input
                    id="addr-region"
                    value={data.region}
                    onChange={(e) => set("region", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-country" className={labelCls}>{t("address.country")}</label>
                <input
                    id="addr-country"
                    required
                    value={data.country}
                    onChange={(e) => set("country", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-phone" className={labelCls}>{t("address.phone")}</label>
                <input
                    id="addr-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="\+?\d{4,20}"
                    maxLength={21}
                    placeholder={t("address.phonePlaceholder")}
                    value={data.phone}
                    onChange={(e) => set("phone", sanitizePhone(e.target.value))}
                    className={inputCls}
                />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/15 bg-white px-4 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {t("common.cancel")}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ color: "#fff" }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t("address.saving")}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                                <path d="m3 8 3.5 3.5L13 5" />
                            </svg>
                            {resolvedSubmitLabel}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
