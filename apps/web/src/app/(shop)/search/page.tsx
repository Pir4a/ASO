import Link from "next/link";
import { CategoryIndexHero } from "@/components/category/CategoryIndexHero";
import { CategoryPagination } from "@/components/category/CategoryPagination";
import { ProductCatalogListing } from "@/components/product/ProductCatalogListing";
import {
  PRODUCT_SEARCH_SORT,
  type ProductSearchFacets,
  type ProductSearchMeta,
  type ProductSearchSortParam,
  getCategories,
  getProductsSearch,
} from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import type { Product } from "@bootstrap/types";

type SearchPageParams = {
  q?: string;
  categorySlug?: string;
  minPrice?: string;
  maxPrice?: string;
  inStockOnly?: string;
  sort?: string;
  page?: string;
};

function preservedQueryFrom(raw: SearchPageParams): string {
  const p = new URLSearchParams();
  if (raw.q?.trim()) p.set("q", raw.q.trim());
  if (raw.categorySlug?.trim()) p.set("categorySlug", raw.categorySlug.trim());
  if (raw.minPrice?.trim()) p.set("minPrice", raw.minPrice.trim());
  if (raw.maxPrice?.trim()) p.set("maxPrice", raw.maxPrice.trim());
  if (raw.inStockOnly === "1" || raw.inStockOnly === "true") p.set("inStockOnly", "1");
  if (raw.sort && PRODUCT_SEARCH_SORT.includes(raw.sort as ProductSearchSortParam)) {
    p.set("sort", raw.sort);
  }
  return p.toString();
}

function facetCountBySlug(facets: ProductSearchFacets, slug: string): number | undefined {
  return facets.categories.find((c) => c.slug === slug)?.count;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const raw = await searchParams;
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const limit = 12;
  const sort = PRODUCT_SEARCH_SORT.includes(raw.sort as ProductSearchSortParam)
    ? (raw.sort as ProductSearchSortParam)
    : "relevance";
  const inStockOnly = raw.inStockOnly === "1" || raw.inStockOnly === "true";

  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  let products: Product[] = [];
  let meta: ProductSearchMeta = {
    total: 0,
    page: 1,
    pageSize: limit,
    totalPages: 1,
  };
  let facets: ProductSearchFacets = { categories: [] };
  let apiOk = true;

  try {
    const res = await getProductsSearch({
      q: raw.q,
      categorySlug: raw.categorySlug,
      minPrice: raw.minPrice,
      maxPrice: raw.maxPrice,
      inStockOnly,
      sort,
      page,
      limit,
    });
    products = res.products;
    meta = res.meta;
    facets = res.facets;
  } catch {
    apiOk = false;
  }

  const categories = await getCategories();
  const qDefault = raw.q ?? "";
  const categoryDefault = raw.categorySlug ?? "";
  const minDefault = raw.minPrice ?? "";
  const maxDefault = raw.maxPrice ?? "";

  const sortLabels: Record<ProductSearchSortParam, string> = {
    relevance: t("search.sort.relevance"),
    price_asc: t("search.sort.price_asc"),
    price_desc: t("search.sort.price_desc"),
    novelty_desc: t("search.sort.novelty_desc"),
    novelty_asc: t("search.sort.novelty_asc"),
    availability_asc: t("search.sort.availability_asc"),
    availability_desc: t("search.sort.availability_desc"),
  };

  return (
    <div className="space-y-10">
      <CategoryIndexHero
        eyebrow={t("header.search")}
        title={t("search.title")}
        subtitle={t("search.subtitle")}
        headingId="search-page-heading"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start">
        <aside className="card space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {t("search.filtersTitle")}
          </h2>
          <form method="get" action="/search" className="space-y-4">
            <div>
              <label htmlFor="search-q" className="block text-xs font-semibold text-slate-700">
                {t("search.queryLabel")}
              </label>
              <p className="mb-1 text-[11px] text-slate-500">{t("search.queryHint")}</p>
              <input
                id="search-q"
                name="q"
                defaultValue={qDefault}
                placeholder={t("header.searchPlaceholder")}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="search-cat" className="block text-xs font-semibold text-slate-700">
                {t("search.category")}
              </label>
              <select
                id="search-cat"
                name="categorySlug"
                defaultValue={categoryDefault}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="">{t("search.categoryAll")}</option>
                {categories.map((c) => {
                  const n = facetCountBySlug(facets, c.slug);
                  const label = n !== undefined ? `${c.name} (${n})` : c.name;
                  return (
                    <option key={c.id} value={c.slug}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="search-min" className="block text-xs font-semibold text-slate-700">
                  {t("search.minPrice")}
                </label>
                <input
                  id="search-min"
                  name="minPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={minDefault}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="search-max" className="block text-xs font-semibold text-slate-700">
                  {t("search.maxPrice")}
                </label>
                <input
                  id="search-max"
                  name="maxPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={maxDefault}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" name="inStockOnly" value="1" defaultChecked={inStockOnly} />
              {t("search.inStockOnly")}
            </label>

            <div>
              <label htmlFor="search-sort" className="block text-xs font-semibold text-slate-700">
                {t("search.sortLabel")}
              </label>
              <select
                id="search-sort"
                name="sort"
                defaultValue={sort}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
              >
                {PRODUCT_SEARCH_SORT.map((v) => (
                  <option key={v} value={v}>
                    {sortLabels[v]}
                  </option>
                ))}
              </select>
            </div>

            <input type="hidden" name="page" value="1" />
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                {t("search.apply")}
              </button>
              <Link
                href="/search"
                className="rounded-lg border border-slate-200 bg-white py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary"
              >
                {t("search.reset")}
              </Link>
            </div>
          </form>
        </aside>

        <section className="card space-y-4 p-6">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <p className="text-sm font-medium text-slate-800">
              {t("search.resultsLine").replace("{total}", String(meta.total))}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {meta.tookMs !== undefined ? (
                <span>{t("search.tookMs").replace("{ms}", String(meta.tookMs))}</span>
              ) : null}
              {meta.relevanceRefined ? <span>{t("search.relevanceRefined")}</span> : null}
            </div>
          </div>

          {!apiOk ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("search.apiUnavailable")}
            </p>
          ) : products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              {t("search.empty")}
            </p>
          ) : (
            <ProductCatalogListing products={products} />
          )}

          <CategoryPagination
            basePath="/search"
            page={meta.page}
            totalPages={meta.totalPages}
            preservedQuery={preservedQueryFrom(raw)}
          />
        </section>
      </div>
    </div>
  );
}
