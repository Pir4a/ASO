"use client";

import { useT } from "@/context/LocaleContext";

/**
 * WCAG 2.1 (2.4.1 Bypass Blocks) skip-link.
 * Hidden until focused by keyboard navigation, then appears pinned to the top-left.
 */
export function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      {t("a11y.skipToContent")}
    </a>
  );
}
