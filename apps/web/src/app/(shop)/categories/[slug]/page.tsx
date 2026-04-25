import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProducts, getProductsByCategorySlug } from "@/lib/api";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";

export default async function CategoryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q: rawQ } = await searchParams;
  const initialQuery = (rawQ ?? "").trim();

  const [categories, allProducts, page] = await Promise.all([
    getCategories(),
    getProducts(),
    getProductsByCategorySlug(slug, { page: 1, limit: 48 }),
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
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <Link href="/categories" className="hover:text-primary">
          Catégories
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
      />
    </div>
  );
}
