export type Locale = "fr" | "en" | "ar";

export const availableLocales: Locale[] = ["fr", "en", "ar"];

const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined;
export const defaultLocale: Locale =
  envDefault && availableLocales.includes(envDefault) ? envDefault : "fr";

export const isRtl = (locale: Locale) => locale === "ar";

