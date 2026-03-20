"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n.shared";
import { createTranslator } from "@/lib/translations";

interface I18nContextValue {
    locale: Locale;
    t: (key: string, params?: Record<string, string | number>) => string;
    isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
    locale: Locale;
    children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
    const value = useMemo<I18nContextValue>(() => ({
        locale,
        t: createTranslator(locale),
        isRtl: locale === "ar",
    }), [locale]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error("useTranslation must be used within an I18nProvider");
    }

    return context;
}
