"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/context/LocaleContext";

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
    submitLabel = "Enregistrer",
}: AddressFormProps) {
    const locale = useLocale();
    const copy = ADDRESS_FORM_COPY[locale];
    const [data, setData] = useState<AddressFormData>({
        firstName: initialData?.firstName ?? "",
        lastName: initialData?.lastName ?? "",
        street: initialData?.street ?? "",
        address2: initialData?.address2 ?? "",
        city: initialData?.city ?? "",
        region: initialData?.region ?? "",
        postalCode: initialData?.postalCode ?? "",
        country: initialData?.country ?? copy.defaultCountry,
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

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="addr-fn" className={labelCls}>{copy.firstName}</label>
                <input
                    id="addr-fn"
                    required
                    value={data.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-ln" className={labelCls}>{copy.lastName}</label>
                <input
                    id="addr-ln"
                    required
                    value={data.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-street" className={labelCls}>{copy.address}</label>
                <input
                    id="addr-street"
                    required
                    placeholder={copy.streetPlaceholder}
                    value={data.street}
                    onChange={(e) => set("street", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-2" className={labelCls}>
                    {copy.address2} <span className="font-normal lowercase tracking-normal text-foreground/45">({copy.optional})</span>
                </label>
                <input
                    id="addr-2"
                    placeholder={copy.address2Placeholder}
                    value={data.address2}
                    onChange={(e) => set("address2", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-postal" className={labelCls}>{copy.postalCode}</label>
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
                <label htmlFor="addr-city" className={labelCls}>{copy.city}</label>
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
                    {copy.region} <span className="font-normal lowercase tracking-normal text-foreground/45">({copy.optional})</span>
                </label>
                <input
                    id="addr-region"
                    value={data.region}
                    onChange={(e) => set("region", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div>
                <label htmlFor="addr-country" className={labelCls}>{copy.country}</label>
                <input
                    id="addr-country"
                    required
                    value={data.country}
                    onChange={(e) => set("country", e.target.value)}
                    className={inputCls}
                />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="addr-phone" className={labelCls}>{copy.phone}</label>
                <input
                    id="addr-phone"
                    type="tel"
                    placeholder={copy.phonePlaceholder}
                    value={data.phone}
                    onChange={(e) => set("phone", e.target.value)}
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
                    {copy.cancel}
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
                            {copy.saving}
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                                <path d="m3 8 3.5 3.5L13 5" />
                            </svg>
                            {submitLabel}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

const ADDRESS_FORM_COPY = {
    fr: {
        defaultCountry: "France",
        firstName: "Prénom",
        lastName: "Nom",
        address: "Adresse",
        streetPlaceholder: "Numéro et rue",
        address2: "Complément d'adresse",
        optional: "optionnel",
        address2Placeholder: "Bât., étage, code…",
        postalCode: "Code postal",
        city: "Ville",
        region: "Région",
        country: "Pays",
        phone: "Téléphone mobile",
        phonePlaceholder: "+33 6 12 34 56 78",
        cancel: "Annuler",
        saving: "Enregistrement…",
    },
    en: {
        defaultCountry: "France",
        firstName: "First name",
        lastName: "Last name",
        address: "Address",
        streetPlaceholder: "Street and number",
        address2: "Address line 2",
        optional: "optional",
        address2Placeholder: "Building, floor, code…",
        postalCode: "Postal code",
        city: "City",
        region: "Region",
        country: "Country",
        phone: "Mobile phone",
        phonePlaceholder: "+1 555 123 4567",
        cancel: "Cancel",
        saving: "Saving…",
    },
    ar: {
        defaultCountry: "France",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        address: "العنوان",
        streetPlaceholder: "الشارع ورقم المبنى",
        address2: "تكملة العنوان",
        optional: "اختياري",
        address2Placeholder: "المبنى، الطابق، الرمز…",
        postalCode: "الرمز البريدي",
        city: "المدينة",
        region: "المنطقة",
        country: "الدولة",
        phone: "الهاتف المحمول",
        phonePlaceholder: "+33 6 12 34 56 78",
        cancel: "إلغاء",
        saving: "جارٍ الحفظ…",
    },
    he: {
        defaultCountry: "France",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        address: "כתובת",
        streetPlaceholder: "רחוב ומספר",
        address2: "שורת כתובת נוספת",
        optional: "אופציונלי",
        address2Placeholder: "בניין, קומה, קוד…",
        postalCode: "מיקוד",
        city: "עיר",
        region: "אזור",
        country: "מדינה",
        phone: "טלפון נייד",
        phonePlaceholder: "+33 6 12 34 56 78",
        cancel: "ביטול",
        saving: "שומר…",
    },
} as const;
