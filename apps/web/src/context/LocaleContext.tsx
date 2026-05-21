"use client";

import { createContext, useCallback, useContext } from "react";
import type { Locale } from "@/lib/i18n.shared";
import { defaultLocale } from "@/lib/i18n.shared";
import { getTranslations, tPlural, type TranslationKey, type TranslationVars } from "@/lib/translations";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
    return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
    return useContext(LocaleContext);
}

export function useT() {
    const locale = useContext(LocaleContext);
    return useCallback(
        (key: TranslationKey, vars?: TranslationVars) => getTranslations(locale)(key, vars),
        [locale],
    );
}

export function useTPlural() {
    const locale = useContext(LocaleContext);
    return useCallback(
        (base: string, count: number, vars?: TranslationVars) => tPlural(locale, base, count, vars),
        [locale],
    );
}
