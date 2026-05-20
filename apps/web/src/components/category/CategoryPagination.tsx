"use client";

import Link from "next/link";
import { useT } from "@/context/LocaleContext";

type CategoryPaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  /** Preserve filters (omit `page` here; it is set per link). */
  preservedQuery?: string;
};

export function CategoryPagination({
  basePath,
  page,
  totalPages,
  preservedQuery,
}: CategoryPaginationProps) {
  const t = useT();
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  const href = (p: number) => {
    if (!preservedQuery) {
      return p === 1 ? basePath : `${basePath}?page=${p}`;
    }
    const qs = new URLSearchParams(preservedQuery);
    if (p <= 1) qs.delete("page");
    else qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4"
      aria-label={t("search.title")}
    >
      <div className="text-sm text-foreground/70">
        {t("pagination.pageOf")
          .replace("{current}", String(page))
          .replace("{total}", String(totalPages))}
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={href(prev)}
            className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            {t("a11y.carouselPrev")}
          </Link>
        ) : (
          <span className="rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-semibold text-foreground/50">
            {t("a11y.carouselPrev")}
          </span>
        )}
        {next ? (
          <Link
            href={href(next)}
            className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
          >
            {t("a11y.carouselNext")}
          </Link>
        ) : (
          <span className="rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm font-semibold text-foreground/50">
            {t("a11y.carouselNext")}
          </span>
        )}
      </div>
    </nav>
  );
}
