"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  type PageSize,
} from "./PaginationControls.shared";

export { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, type PageSize, resolvePagination } from "./PaginationControls.shared";

export interface PaginationControlsProps {
  /** Total number of items across all pages */
  totalItems: number;
  /** Current 1-based page number */
  currentPage: number;
  /** Current page size */
  pageSize: PageSize;
  /** Optional list of page sizes (defaults to 10/25/50) */
  pageSizeOptions?: readonly number[];
  /** Query-string key for the page number (default: `page`) */
  pageParam?: string;
  /** Query-string key for the page size (default: `size`) */
  sizeParam?: string;
  /** Optional className applied to the wrapper */
  className?: string;
}

/**
 * URL-driven pagination controls (page + size selector).
 *
 * State lives in the URL via `searchParams`, so it works with
 * server components: parents read `searchParams`, slice the data
 * accordingly, and render this client component for navigation.
 */
export function PaginationControls({
  totalItems,
  currentPage,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  pageParam = "page",
  sizeParam = "size",
  className,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const buildHref = (nextPage: number, nextSize: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextPage <= 1) params.delete(pageParam);
    else params.set(pageParam, String(nextPage));
    if (nextSize === DEFAULT_PAGE_SIZE) params.delete(sizeParam);
    else params.set(sizeParam, String(nextSize));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const navigate = (nextPage: number, nextSize: number) => {
    startTransition(() => {
      router.push(buildHref(nextPage, nextSize), { scroll: false });
    });
  };

  const onSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number(e.target.value);
    navigate(1, nextSize);
  };

  const goTo = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === safePage) return;
    navigate(nextPage, pageSize);
  };

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safePage * pageSize);

  return (
    <div
      className={
        "flex flex-col items-center justify-between gap-3 border-t border-primary/15 pt-4 text-sm text-foreground/80 md:flex-row " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-2">
        <label htmlFor="pagination-size" className="text-foreground/70">
          Afficher
        </label>
        <select
          id="pagination-size"
          aria-label="Nombre d'éléments par page"
          className="cursor-pointer rounded-md border border-primary/25 bg-background px-2 py-1 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          value={pageSize}
          onChange={onSizeChange}
          disabled={isPending}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className="text-foreground/60">par page</span>
      </div>

      <p className="text-xs text-foreground/60">
        {totalItems === 0
          ? "Aucun élément"
          : `${startIndex}–${endIndex} sur ${totalItems}`}
      </p>

      <nav
        aria-label="Pagination"
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => goTo(safePage - 1)}
          disabled={safePage <= 1 || isPending}
          className="cursor-pointer rounded-md border border-primary/25 px-3 py-1 text-sm font-medium text-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-primary/25 disabled:hover:text-foreground"
        >
          Précédent
        </button>
        <span className="text-xs text-foreground/70">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goTo(safePage + 1)}
          disabled={safePage >= totalPages || isPending}
          className="cursor-pointer rounded-md border border-primary/25 px-3 py-1 text-sm font-medium text-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-primary/25 disabled:hover:text-foreground"
        >
          Suivant
        </button>
      </nav>
    </div>
  );
}
