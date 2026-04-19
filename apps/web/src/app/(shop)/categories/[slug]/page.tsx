import { notFound } from "next/navigation";
import { getCategories, getProductsByCategorySlug } from "@/lib/api";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryProductListing } from "@/components/category/CategoryProductListing";
import { CategoryPagination } from "@/components/category/CategoryPagination";

export default async function CategoryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return notFound();

  const { products, meta } = await getProductsByCategorySlug(slug, { page, limit: 12 });

  return (
    <div className="space-y-8">
      <CategoryHero name={category.name} description={category.description} imageUrl={category.imageUrl} />

      <section className="card space-y-4 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Produits</h2>
            <p className="text-sm text-slate-600">
              Tri : priorité catalogue (backoffice), puis disponibles, puis rupture.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {meta.total} produit{meta.total !== 1 ? "s" : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            Aucun produit dans cette catégorie.
          </p>
        ) : (
          <CategoryProductListing products={products} />
        )}

        <CategoryPagination basePath={`/categories/${slug}`} page={meta.page} totalPages={meta.totalPages} />
      </section>
    </div>
  );
}
