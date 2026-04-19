"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { availableLocales, type Locale } from "@/lib/i18n.shared";

const localeLabels: Record<Locale, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" },
  ar: { flag: "🇸🇦", label: "العربية" },
  he: { flag: "🇮🇱", label: "עברית" },
};

export function LocaleSwitcher({ value }: { value: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Locale) => {
    startTransition(() => {
      document.cookie = `locale=${next}; path=/; max-age=31536000`;
      router.refresh();
    });
  };

  return (
    <select
      aria-label="Language"
      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      defaultValue={value}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value as Locale)}
    >
      {availableLocales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale].flag} {localeLabels[locale].label}
        </option>
      ))}
    </select>
  );
}
