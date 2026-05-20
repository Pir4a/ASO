import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PRODUCT_SEARCH_SORT,
  getCategories,
  getProducts,
  getProductsByCategorySlug,
  getProductsSearch,
  type ProductSearchSortParam,
} from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";

export default async function CategoryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
  }>;
}) {
  const { slug } = await params;
  const {
    q: rawQ,
    minPrice: rawMin,
    maxPrice: rawMax,
    inStock: rawInStock,
    sort: rawSort,
  } = await searchParams;
  const initialQuery = (rawQ ?? "").trim();
  const initialMinPrice = (rawMin ?? "").trim();
  const initialMaxPrice = (rawMax ?? "").trim();
  const initialInStockOnly = rawInStock === "1";
  const initialSort: ProductSearchSortParam = PRODUCT_SEARCH_SORT.includes(
    (rawSort ?? "") as ProductSearchSortParam,
  )
    ? (rawSort as ProductSearchSortParam)
    : "relevance";
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  // Switch to the search API as soon as any facet/sort/query is active —
  // it can filter, sort, and paginate by category in one round-trip.
  // Otherwise keep the simpler category-browse call for the default view.
  const useSearchApi =
    initialQuery.length > 0 ||
    initialMinPrice.length > 0 ||
    initialMaxPrice.length > 0 ||
    initialInStockOnly ||
    initialSort !== "relevance";

  const [categories, allProducts, page] = await Promise.all([
    getCategories(),
    getProducts(),
    useSearchApi
      ? getProductsSearch({
          q: initialQuery || undefined,
          categorySlug: slug,
          minPrice: initialMinPrice || undefined,
          maxPrice: initialMaxPrice || undefined,
          inStockOnly: initialInStockOnly,
          page: 1,
          limit: 48,
          sort: initialSort,
        }).then((res) => ({ products: res.products, meta: res.meta }))
      : getProductsByCategorySlug(slug, { page: 1, limit: 48 }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) return notFound();

  const products = page.products;
  const availableTotal = products.filter(
    (p) => p.status !== "out_of_stock" && (p.stock ?? 0) > 0,
  ).length;

  // Counts for the filter rail — based on full product set, mapped by slug
  const productCounts: Record<string, number> = {};
  for (const c of categories) {
    productCounts[c.slug] = allProducts.filter((p) => p.categoryId === c.id).length;
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("auth.login.breadcrumbLabel")}
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          {t("common.home")}
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <Link href="/categories" className="hover:text-primary">
          {t("header.categories")}
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">{category.name}</span>
      </nav>

      <CategoryHero
        name={category.name}
        description={category.description}
        imageUrl={category.imageUrl}
        productsTotal={page.meta.total}
        availableTotal={availableTotal}
      />

      <CategoryCatalog
        categories={categories}
        activeSlug={slug}
        products={products}
        productCounts={productCounts}
        initialQuery={initialQuery}
        initialMinPrice={initialMinPrice}
        initialMaxPrice={initialMaxPrice}
        initialInStockOnly={initialInStockOnly}
        initialSort={initialSort}
        serverDriven={useSearchApi}
      />
    </div>
  );
}
