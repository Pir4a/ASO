export type Locale = "fr" | "en" | "ar" | "he";

export const availableLocales: Locale[] = ["fr", "en", "ar", "he"];

const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined;
export const defaultLocale: Locale =
  envDefault && availableLocales.includes(envDefault) ? envDefault : "fr";

const rtlLocales: readonly Locale[] = ["ar", "he"];
export const isRtl = (locale: Locale) => rtlLocales.includes(locale);

/**
 * BCP-47 tag fed into `Intl.*` so currency-symbol position, separators and
 * numerals match the user's expected region rather than the bare language.
 *
 * fr-FR vs fr-CH for example put the currency symbol on different sides;
 * en-GB vs en-US format dates differently. We bias to the most common
 * commercial choice for our market.
 */
export const intlLocale: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "ar-SA",
  he: "he-IL",
};

