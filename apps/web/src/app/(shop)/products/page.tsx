import Link from "next/link";
import { getCategories, getProducts, getProductsCatalog } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const initialQuery = (rawQ ?? "").trim();

  const [categories, allProducts, page] = await Promise.all([
    getCategories(),
    getProducts(),
    getProductsCatalog({ page: 1, limit: 48 }),
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
    </div>
  );
}
