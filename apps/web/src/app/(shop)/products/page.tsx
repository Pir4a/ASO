import { Suspense } from "react";
import Link from "next/link";
import { searchProducts, getCategories } from "@/lib/api";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/product/Pagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SearchParams {
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
}

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const search = searchParams?.search || "";
  const categoryId = searchParams?.category || "";
  const sortBy = (searchParams?.sortBy as "createdAt" | "name" | "price" | "relevance") || "createdAt";
  const sortOrder = (searchParams?.sortOrder as "asc" | "desc") || "desc";
  const page = parseInt(searchParams?.page || "1", 10);
  const minPrice = searchParams?.minPrice || "";
  const maxPrice = searchParams?.maxPrice || "";
  const availability = (searchParams?.availability as "in_stock" | "out_of_stock") || "";

  const [productsResult, categories] = await Promise.all([
    searchProducts({
      search: search || undefined,
      categoryId: categoryId || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 12,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      availability: availability || undefined,
    }),
    getCategories(),
  ]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Filters */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Catalogue</h1>
          <p className="text-muted-foreground mt-2">
            {productsResult.total} produit{productsResult.total !== 1 ? "s" : ""} trouvé{productsResult.total !== 1 ? "s" : ""}
            {search && ` pour "${search}"`}
            {selectedCategory && ` dans ${selectedCategory.name}`}
          </p>
        </div>

        <div className="rounded-xl bg-white p-1">
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground animate-pulse">Chargement des filtres...</div>}>
            <ProductFilters
              categories={categories}
              initialSearch={search}
              initialCategory={categoryId}
              initialSortBy={sortBy}
              initialSortOrder={sortOrder}
              initialMinPrice={minPrice}
              initialMaxPrice={maxPrice}
              initialAvailability={availability}
            />
          </Suspense>
        </div>
      </div>

      {/* Products Grid */}
      {productsResult.items.length > 0 ? (
        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
          <ProductGrid products={productsResult.items} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-lg font-medium text-slate-900">Aucun produit trouvé</p>
          <p className="text-muted-foreground mb-4">Essayez de modifier vos filtres.</p>
          <Link href="/products" className="text-primary font-semibold hover:underline">
            Réinitialiser les filtres
          </Link>
        </div>
      )}

      {/* Pagination */}
      <Suspense fallback={null}>
        <Pagination
          currentPage={productsResult.page}
          totalPages={productsResult.totalPages}
        />
      </Suspense>
    </div>
  );
}

