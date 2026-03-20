import frTranslations from "@/translations/fr.json";
import enTranslations from "@/translations/en.json";
import arTranslations from "@/translations/ar.json";
import type { Locale } from "./i18n.shared";

// Type-safe translation keys
export type TranslationKey = keyof typeof frTranslations;

const translations: Record<Locale, typeof frTranslations> = {
    fr: frTranslations,
    en: enTranslations,
    ar: arTranslations,
};

/**
 * Get translation for a nested key like "products.addToCart"
 */
export function getTranslation(locale: Locale, key: string): string {
    const keys = key.split(".");
    let current: any = translations[locale];

    for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
            current = current[k];
        } else {
            // Fallback to French if key not found
            current = translations.fr;
            for (const fk of keys) {
                if (current && typeof current === "object" && fk in current) {
                    current = current[fk];
                } else {
                    return key; // Return key if not found at all
                }
            }
            break;
        }
    }

    return typeof current === "string" ? current : key;
}

/**
 * Create a translation function bound to a specific locale
 */
export function createTranslator(locale: Locale) {
    return (key: string, params?: Record<string, string | number>) => {
        let text = getTranslation(locale, key);

        // Replace parameters like {{name}} with values
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                text = text.replace(new RegExp(`{{${param}}}`, "g"), String(value));
            });
        }

        return text;
    };
}

// Export all translations for static usage
export { translations };
