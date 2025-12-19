import "server-only";

import { cookies } from "next/headers";
import { availableLocales, defaultLocale, type Locale } from "./i18n.shared";

export const getLocaleFromCookie = async (): Promise<Locale> => {
  const store = await cookies();
  const stored = store.get("locale")?.value as Locale | undefined;
  if (stored && availableLocales.includes(stored)) {
    return stored;
  }
  return defaultLocale;
};

