import Link from "next/link";
import { getProductsCatalog } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryIndexHero } from "@/components/category/CategoryIndexHero";
import { CategoryPagination } from "@/components/category/CategoryPagination";
import { ProductCatalogListing } from "@/components/product/ProductCatalogListing";

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const { products, meta } = await getProductsCatalog({ page, limit: 12 });

  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-10">
      <CategoryIndexHero
        eyebrow={t("products.heroEyebrow")}
        title={t("products.catalogTitle")}
        subtitle={t("products.catalogSubtitle")}
        headingId="products-catalog-heading"
      />

      <section className="card space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-slate-600">{t("products.sortHint")}</p>
            <Link
              href="/search"
              className="inline-flex w-fit shrink-0 items-center rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
            >
              {t("products.searchFiltersLink")}
            </Link>
          </div>
          <p className="text-sm font-medium text-slate-600 sm:text-end">
            {meta.total}{" "}
            {meta.total === 1 ? t("products.countSingle") : t("products.countPlural")}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
            {t("products.empty")}
          </p>
        ) : (
          <ProductCatalogListing products={products} />
        )}

        <CategoryPagination basePath="/products" page={meta.page} totalPages={meta.totalPages} />
      </section>
    </div>
  );
}
