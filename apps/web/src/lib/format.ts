import type { Locale } from "./i18n.shared";
import { intlLocale } from "./i18n.shared";

export function formatMoney(locale: Locale, cents: number, currency = "EUR"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(locale: Locale, value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat(intlLocale[locale], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return value.toFixed(2);
}
