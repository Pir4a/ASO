"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/context/LocaleContext";
import type { Category, Product } from "@bootstrap/types";

type SortKey = "priority" | "name" | "price-asc" | "price-desc";
type ViewMode = "grid" | "list";

function isOutOfStock(p: Product) {
  return p.status === "out_of_stock" || (p.stock !== undefined && p.stock <= 0);
}

function formatPrice(p: Product) {
  const value = p.priceCents / 100;
  return value >= 1000 ? value.toLocaleString("fr-FR") : value.toFixed(2);
}

function StockBadge({
  out,
  inStockLabel,
  outOfStockLabel,
  variant = "card",
}: {
  out: boolean;
  inStockLabel: string;
  outOfStockLabel: string;
  variant?: "card" | "row";
}) {
  const base =
    variant === "row"
      ? "inline-flex items-center gap-1.5 text-[12.5px] font-medium"
      : "inline-flex items-center gap-1.5 text-[12.5px] font-medium";
  if (out) {
    return (
      <span className={`${base} text-error`}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
          <circle cx="8" cy="8" r="6" />
          <path d="m4.5 4.5 7 7" />
        </svg>
        {outOfStockLabel}
      </span>
    );
  }
  return (
    <span className={`${base} text-success`}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3 w-3">
        <path d="m3 8 3.5 3.5L13 5" />
      </svg>
      {inStockLabel}
    </span>
  );
}

const CAT_ICON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="h-4 w-4">
    <path d="M2.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-7.5Z" />
  </svg>
);

const PLACEHOLDER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-12 w-12">
    <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
  </svg>
);

export function CategoryCatalog({
  categories,
  activeSlug,
  products,
  productCounts,
  allHref,
  allCount,
  initialQuery = "",
  firstProductId,
}: {
  categories: Category[];
  /** Slug of the active category, or `null`/`undefined` when showing all products. */
  activeSlug?: string | null;
  products: Product[];
  productCounts: Record<string, number>;
  /** When provided, the rail prepends a "Toutes les catégories" entry pointing here. */
  allHref?: string;
  /** Total when `allHref` is provided. Defaults to sum of productCounts. */
  allCount?: number;
  /** Pre-fills the toolbar search input (e.g. from `?q=` URL param). */
  initialQuery?: string;
  /** When provided, the first rendered product gets this DOM id for scrolling. */
  firstProductId?: string;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [query, setQuery] = useState(initialQuery);
  const isProductsCatalogPage = allHref === "/products" && !activeSlug;
  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "priority", label: t("search.sort.relevance") },
    { value: "name", label: "A→Z" },
    { value: "price-asc", label: t("search.sort.price_asc") },
    { value: "price-desc", label: t("search.sort.price_desc") },
  ];

  // Tracks the value we last pushed to the URL ourselves. Lets us tell
  // apart "URL changed because we navigated" (skip prop sync) from "URL
  // changed externally — back/forward, deep link" (adopt prop). Without
  // this guard, the prop sync below would stomp keystrokes that landed
  // while the server was still computing the previous query's response.
  const lastSyncedQueryRef = useRef(initialQuery);

  useEffect(() => {
    if (initialQuery === lastSyncedQueryRef.current) return;
    setQuery(initialQuery);
    lastSyncedQueryRef.current = initialQuery;
  }, [initialQuery]);

  useEffect(() => {
    if (!isProductsCatalogPage) return;
    const currentQ = (searchParams.get("q") ?? "").trim();
    const nextQ = query.trim();
    if (currentQ === nextQ) return;

    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (nextQ) {
        next.set("q", nextQ);
      } else {
        next.delete("q");
      }
      next.set("page", "1");
      const qs = next.toString();
      lastSyncedQueryRef.current = nextQ;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [isProductsCatalogPage, pathname, query, router, searchParams]);

  const sortedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !isProductsCatalogPage && q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku ?? "").toLowerCase().includes(q),
        )
      : products.slice();

    const stockRank = (p: Product) => (isOutOfStock(p) ? 1 : 0);

    list = list.sort((a, b) => {
      const sa = stockRank(a);
      const sb = stockRank(b);
      if (sa !== sb) return sa - sb;
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.priceCents - b.priceCents;
        case "price-desc":
          return b.priceCents - a.priceCents;
        case "priority":
        default: {
          const pa = b.listPriority ?? 0;
          const pb = a.listPriority ?? 0;
          if (pa !== pb) return pa - pb;
          return a.name.localeCompare(b.name);
        }
      }
    });

    return list;
  }, [isProductsCatalogPage, products, query, sortKey]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[248px_1fr]">
      {/* ─────── Filter rail ─────── */}
      <aside className="lg:sticky lg:top-4">
        <div className="overflow-hidden rounded-xl border border-foreground/10 bg-white p-1.5">
          <div className="px-3.5 py-3">
            <p className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground/55">
              {t("search.category")}
              <span aria-hidden="true" className="h-px flex-1 bg-foreground/10" />
            </p>
            <ul className="flex flex-col gap-0.5 lg:flex-col">
              {allHref && (
                <li>
                  <Link
                    href={allHref}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition ${
                      !activeSlug
                        ? "bg-background font-semibold text-foreground"
                        : "text-foreground hover:bg-background/60 hover:text-primary"
                    }`}
                  >
                    <span className={`flex-none ${!activeSlug ? "text-primary" : "text-foreground/55"}`}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="h-4 w-4">
                        <rect x="2" y="2" width="5" height="5" rx="1" />
                        <rect x="9" y="2" width="5" height="5" rx="1" />
                        <rect x="2" y="9" width="5" height="5" rx="1" />
                        <rect x="9" y="9" width="5" height="5" rx="1" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t("search.categoryAll")}</span>
                    <span
                      className={`tabular-nums text-[11px] font-semibold ${
                        !activeSlug ? "text-primary" : "text-foreground/55"
                      }`}
                    >
                      {allCount ??
                        Object.values(productCounts).reduce((a, b) => a + b, 0)}
                    </span>
                  </Link>
                </li>
              )}
              {categories.map((c) => {
                const isActive = c.slug === activeSlug;
                const count = productCounts[c.slug] ?? 0;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/categories/${c.slug}`}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition ${
                        isActive
                          ? "bg-background font-semibold text-foreground"
                          : "text-foreground hover:bg-background/60 hover:text-primary"
                      }`}
                    >
                      <span className={`flex-none ${isActive ? "text-primary" : "text-foreground/55"}`}>
                        {CAT_ICON}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span
                        className={`tabular-nums text-[11px] font-semibold ${
                          isActive ? "text-primary" : "text-foreground/55"
                        }`}
                      >
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* ─────── Catalog content ─────── */}
      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-white px-4 py-3.5 sm:px-5">
          {/* Search (left) */}
          <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-foreground/10 bg-background/60 px-3 py-1.5 text-[13px] text-foreground/55 sm:max-w-[280px]">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 flex-none text-primary">
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("header.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-foreground/55 focus:outline-none"
            />
          </label>

          {/* Product count (right of search) */}
          <p className="text-[13.5px] font-semibold text-foreground">
            <span className="font-heading">{sortedProducts.length}</span>{" "}
            <span className="font-normal text-foreground/55">
              {sortedProducts.length > 1 ? t("products.countPlural") : t("products.countSingle")}
              {query.trim() ? ` correspondant à "${query.trim()}"` : ""}
            </span>
          </p>

          <div className="flex-1" />

          {/* Sort */}
          <label className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-background/60 px-3 py-1.5 text-[13px] font-medium text-foreground transition hover:border-primary-hover">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 text-primary">
              <path d="M4 3v10m0 0-2-2m2 2 2-2M12 13V3m0 0-2 2m2-2 2 2" />
            </svg>
            <span>{t("search.sortLabel")}</span>
            <span aria-hidden="true" className="h-4 w-px bg-foreground/15" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none border-0 bg-transparent pr-4 text-[13px] font-medium text-foreground focus:outline-none"
              aria-label={t("search.sortLabel")}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3 w-3 text-foreground/55">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </label>

          {/* View toggle */}
          <div
            role="tablist"
            aria-label="Mode d'affichage"
            className="hidden items-center rounded-lg border border-foreground/10 bg-background/60 p-0.5 sm:inline-flex"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "grid"}
              onClick={() => setView("grid")}
              title="Grille"
              className={`grid h-7 w-8 place-items-center rounded transition ${
                view === "grid" ? "bg-white text-primary shadow-sm" : "text-foreground/55 hover:text-foreground"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3.5 w-3.5">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              title="Liste"
              className={`grid h-7 w-8 place-items-center rounded transition ${
                view === "list" ? "bg-white text-primary shadow-sm" : "text-foreground/55 hover:text-foreground"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Empty state */}
        {sortedProducts.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-foreground/15 bg-white px-6 py-12 text-center text-sm text-foreground/55">
            {t("search.empty")}
          </div>
        )}

        {/* Grid view — sm+ only (mobile always uses list per spec) */}
        {sortedProducts.length > 0 && view === "grid" && (
          <ul className="mt-5 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-3" role="list">
            {sortedProducts.map((product, idx) => {
              const oos = isOutOfStock(product);
              return (
                <li key={product.id} id={firstProductId && idx === 0 ? firstProductId : undefined}>
                  <Link
                    href={`/products/${product.slug}`}
                    aria-disabled={oos}
                    className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white transition duration-200 ${
                      oos
                        ? "border-foreground/5 bg-background/40 opacity-80 grayscale"
                        : "border-foreground/10 hover:-translate-y-0.5 hover:border-primary-hover hover:shadow-[0_10px_26px_rgba(0,61,92,0.12)]"
                    }`}
                    tabIndex={oos ? -1 : 0}
                  >
                    <div className="relative h-44 overflow-hidden border-b border-foreground/5 bg-gradient-to-br from-background to-white">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,61,92,0.04)_0_10px,transparent_10px_20px)]"
                      />
                      {product.thumbnailUrl ? (
                        <Image
                          src={product.thumbnailUrl}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 40vw, 360px"
                          className="object-cover transition duration-300 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-primary">{PLACEHOLDER_ICON}</div>
                      )}
                      {(product.listPriority ?? 0) > 0 && !oos && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded bg-warning px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-foreground">
                          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-2.5 w-2.5">
                            <path d="m8 1.5 1.95 4.18 4.55.45-3.42 3.07.96 4.5L8 11.4l-4.04 2.3.96-4.5L1.5 6.13l4.55-.45L8 1.5Z" />
                          </svg>
                          {t("products.featuredBadge")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
                      <h3
                        className={`font-heading text-[15.5px] font-semibold leading-snug ${
                          oos ? "text-foreground/55" : "text-foreground"
                        }`}
                      >
                        {product.name}
                      </h3>
                      <p
                        className={`mt-1 font-heading text-[19px] font-bold leading-tight ${
                          oos ? "text-foreground/55" : "text-foreground"
                        }`}
                      >
                        <span className="num tabular-nums">{formatPrice(product)}</span>{" "}
                        <span className="text-xs font-medium text-foreground/55">{product.currency}</span>
                      </p>
                      <div className="mt-1.5">
                        <StockBadge
                          out={oos}
                          inStockLabel={t("products.status.in_stock")}
                          outOfStockLabel={t("products.status.out_of_stock")}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* List view — always on mobile, on sm+ when chosen */}
        {sortedProducts.length > 0 && (
          <ul
            className={`mt-5 flex flex-col gap-3 ${view === "grid" ? "sm:hidden" : ""}`}
            role="list"
          >
            {sortedProducts.map((product, idx) => {
              const oos = isOutOfStock(product);
              return (
                <li
                  key={product.id}
                  id={firstProductId && view !== "grid" && idx === 0 ? firstProductId : undefined}
                >
                  <Link
                    href={`/products/${product.slug}`}
                    aria-disabled={oos}
                    className={`grid grid-cols-[80px_1fr] items-center gap-4 rounded-xl border bg-white p-3.5 transition sm:grid-cols-[96px_1fr_auto] ${
                      oos
                        ? "border-foreground/5 bg-background/50 opacity-75 grayscale"
                        : "border-foreground/10 hover:border-primary-hover hover:shadow-[0_6px_18px_rgba(0,61,92,0.08)]"
                    }`}
                    tabIndex={oos ? -1 : 0}
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-foreground/5 bg-gradient-to-br from-background to-white sm:h-24 sm:w-24">
                      {product.thumbnailUrl ? (
                        <Image
                          src={product.thumbnailUrl}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-primary">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-8 w-8">
                            <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-heading text-base font-semibold leading-snug ${
                          oos ? "text-foreground/55" : "text-foreground"
                        }`}
                      >
                        {product.name}
                      </h3>
                      <p
                        className={`mt-1.5 font-heading text-[17px] font-bold leading-tight sm:hidden ${
                          oos ? "text-foreground/55" : "text-foreground"
                        }`}
                      >
                        <span className="num tabular-nums">{formatPrice(product)}</span>{" "}
                        <span className="text-xs font-medium text-foreground/55">{product.currency}</span>
                      </p>
                      <div className="mt-1.5">
                        <StockBadge
                          out={oos}
                          variant="row"
                          inStockLabel={t("products.status.in_stock")}
                          outOfStockLabel={t("products.status.out_of_stock")}
                        />
                      </div>
                    </div>
                    <div className="hidden items-center sm:flex">
                      <p
                        className={`font-heading text-[17px] font-bold leading-tight ${
                          oos ? "text-foreground/55" : "text-foreground"
                        }`}
                      >
                        <span className="num tabular-nums">{formatPrice(product)}</span>{" "}
                        <span className="text-xs font-medium text-foreground/55">{product.currency}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
