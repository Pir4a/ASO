"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { availableLocales, type Locale } from "@/lib/i18n.shared";

const localeMeta: Record<Locale, { flag: string; code: string; label: string }> = {
  en: { flag: "🇬🇧", code: "EN", label: "English" },
  fr: { flag: "🇫🇷", code: "FR", label: "Français" },
  ar: { flag: "🇸🇦", code: "AR", label: "العربية" },
  he: { flag: "🇮🇱", code: "HE", label: "עברית" },
};

export function LocaleSwitcher({
  value,
  tone = "light",
}: {
  value: Locale;
  /** "light" = white pill (default); "dark" = transparent for dark backgrounds (utility strip). */
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Locale) => {
    startTransition(() => {
      document.cookie = `locale=${next}; path=/; max-age=31536000`;
      router.refresh();
    });
  };

  const selectClass =
    tone === "dark"
      ? "appearance-none rounded bg-transparent py-0.5 pl-2 pr-6 text-[12px] font-semibold text-white/90 cursor-pointer transition-colors hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40"
      : "appearance-none rounded-lg border border-foreground/10 bg-white py-1.5 pl-3 pr-7 text-sm font-semibold text-foreground shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary";

  const chevClass =
    tone === "dark" ? "pointer-events-none absolute right-1.5 text-white/65" : "pointer-events-none absolute right-2 text-foreground/60";

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Language — {localeMeta[value].label}</span>
      <select
        aria-label="Language"
        className={selectClass}
        defaultValue={value}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value as Locale)}
      >
        {availableLocales.map((locale) => (
          <option key={locale} value={locale} className="text-foreground">
            {localeMeta[locale].flag} {localeMeta[locale].code}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className={chevClass}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={tone === "dark" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
