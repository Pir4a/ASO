import Link from "next/link";
import { getCategories, getProducts, getProductsCatalog } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";
import {
  PaginationControls,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  type PageSize,
} from "@/components/common/PaginationControls";

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; size?: string }>;
}) {
  const { q: rawQ, page: pageStr, size: sizeStr } = await searchParams;
  const initialQuery = (rawQ ?? "").trim();

  const requestedSize = Number(sizeStr);
  const size: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedSize)
    ? (requestedSize as PageSize)
    : DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);

  const [categories, allProducts, page] = await Promise.all([
    getCategories(),
    getProducts(),
    getProductsCatalog({ page: requestedPage, limit: size }),
  ]);

  const products = page.products;
  const availableTotal = products.filter(
    (p) => p.status !== "out_of_stock" && (p.stock ?? 0) > 0,
  ).length;

  const productCounts: Record<string, number> = {};
  for (const c of categories) {
    productCounts[c.slug] = allProducts.filter((p) => p.categoryId === c.id).length;
  }

  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-6">
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">Catalogue</span>
      </nav>

      <CategoryHero
        eyebrow="Catalogue"
        name={t("products.catalogTitle")}
        description={t("products.catalogSubtitle")}
        productsTotal={page.meta.total}
        availableTotal={availableTotal}
      />

      <CategoryCatalog
        categories={categories}
        activeSlug={null}
        products={products}
        productCounts={productCounts}
        allHref="/products"
        allCount={page.meta.total}
        initialQuery={initialQuery}
      />

      <PaginationControls
        totalItems={page.meta.total}
        currentPage={page.meta.page}
        pageSize={size}
      />
    </div>
  );
}
