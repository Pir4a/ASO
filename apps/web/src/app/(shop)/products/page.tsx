import Link from "next/link";
import { getProducts } from "@/lib/api";

export default async function ProductsListPage() {
  const products = await getProducts();

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Catalogue produits</h1>
        <p className="text-sm text-slate-600">Pagination et filtres seront gérés côté API.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="card p-4 hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{product.name}</p>
              <span className="text-xs text-slate-500">{product.sku}</span>
            </div>
            <p className="text-sm text-primary">
              {(product.priceCents / 100).toFixed(2)} {product.currency}
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">{product.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

