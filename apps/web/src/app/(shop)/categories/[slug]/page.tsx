import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/home/ProductGrid";
import { getCategories, getProducts } from "@/lib/api";

export default async function CategoryDetail({ params }: { params: { slug: string } }) {
  const [categories, productsList] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return notFound();

  const products = productsList.filter((p) => p.categoryId === category.id);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <p className="text-xs uppercase text-slate-500">Catégorie</p>
        <h1 className="text-2xl font-semibold text-slate-900">{category.name}</h1>
        <p className="text-sm text-slate-600">{category.description}</p>
      </div>

      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Produits</h2>
          <p className="text-sm text-slate-600">{products.length} produits</p>
        </div>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}

