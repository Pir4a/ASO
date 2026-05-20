import type { Locale } from "./i18n.shared";

/**
 * Locale-aware price formatter. Keeps the project's existing display rule
 * (no thousand separators below 1000, fixed 2 decimals) but routes the
 * thousand-separator group character through Intl so ar/he/fr/en all use
 * the right glyph.
 */
export function formatPrice(cents: number, currency: string, locale: Locale): string {
    const v = cents / 100;
    const num =
        v >= 1000
            ? v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : v.toFixed(2);
    return `${num} ${currency}`;
}

/**
 * Currency formatter that delegates entirely to Intl. Use when you want the
 * native locale formatting (currency symbol position, separators, RTL).
 */
export function formatCurrency(cents: number, currency: string, locale: Locale): string {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function formatDate(iso: string | Date, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(iso).toLocaleDateString(locale, opts);
}

export function formatDateTime(iso: string | Date, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(iso).toLocaleString(locale, opts);
}
