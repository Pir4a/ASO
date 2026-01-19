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
}

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const search = searchParams?.search || "";
  const categoryId = searchParams?.category || "";
  const sortBy = (searchParams?.sortBy as "createdAt" | "name" | "price") || "createdAt";
  const sortOrder = (searchParams?.sortOrder as "asc" | "desc") || "desc";
  const page = parseInt(searchParams?.page || "1", 10);

  const [productsResult, categories] = await Promise.all([
    searchProducts({
      search: search || undefined,
      categoryId: categoryId || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 12,
    }),
    getCategories(),
  ]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Catalogue produits</CardTitle>
          <CardDescription>
            {productsResult.total} produit{productsResult.total !== 1 ? "s" : ""} trouvé{productsResult.total !== 1 ? "s" : ""}
            {search && ` pour "${search}"`}
            {selectedCategory && ` dans ${selectedCategory.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Chargement des filtres...</div>}>
            <ProductFilters
              categories={categories}
              initialSearch={search}
              initialCategory={categoryId}
              initialSortBy={sortBy}
              initialSortOrder={sortOrder}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {productsResult.items.length > 0 ? (
        <ProductGrid products={productsResult.items} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Aucun produit trouvé.</p>
            <Link href="/products" className="text-primary hover:underline mt-2 inline-block">
              Voir tous les produits
            </Link>
          </CardContent>
        </Card>
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
