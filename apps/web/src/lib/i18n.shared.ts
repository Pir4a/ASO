export type Locale = "fr" | "en" | "ar" | "he";

export const availableLocales: Locale[] = ["fr", "en", "ar", "he"];

const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined;
export const defaultLocale: Locale =
  envDefault && availableLocales.includes(envDefault) ? envDefault : "fr";

const rtlLocales: readonly Locale[] = ["ar", "he"];
export const isRtl = (locale: Locale) => rtlLocales.includes(locale);

export const intlLocale: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "ar-SA",
  he: "he-IL",
};

