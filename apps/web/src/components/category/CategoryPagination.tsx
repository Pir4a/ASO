import Link from "next/link";

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
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
      aria-label="Pagination des produits"
    >
      <div className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{page}</span> sur{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={href(prev)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary hover:text-primary"
          >
            Précédent
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400">
            Précédent
          </span>
        )}
        {next ? (
          <Link
            href={href(next)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary hover:text-primary"
          >
            Suivant
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400">
            Suivant
          </span>
        )}
      </div>
    </nav>
  );
}
