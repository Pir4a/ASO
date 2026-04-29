"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useT } from "@/context/LocaleContext";

interface HeaderSearchBarProps {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

export function HeaderSearchBar({ className, autoFocus, onSubmitted }: HeaderSearchBarProps) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
    onSubmitted?.();
  };

  return (
    <form
      role="search"
      aria-label={t("header.search")}
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className ?? ""}`}
    >
      <label htmlFor="header-search" className="sr-only">
        {t("header.search")}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-foreground/50 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        id="header-search"
        type="search"
        name="q"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("header.searchPlaceholder")}
        className="w-full rounded-xl border border-foreground/10 bg-background/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-foreground/50 shadow-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/30 rtl:pl-10 rtl:pr-10"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label={t("a11y.clearSearch")}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground/50 hover:text-foreground focus:outline-none focus:text-primary rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
      <button
        type="submit"
        className="sr-only focus:not-sr-only focus:absolute focus:right-1 focus:top-1 focus:rounded focus:bg-primary focus:px-2 focus:py-1 focus:text-xs focus:text-white rtl:focus:left-1 rtl:focus:right-auto"
      >
        {t("a11y.searchSubmit")}
      </button>
    </form>
  );
}
