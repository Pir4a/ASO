import Link from "next/link";
import { getProducts } from "@/lib/api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string };
}) {
  const query = searchParams?.q?.toLowerCase() ?? "";
  const products = await getProducts();
  const results = query ? products.filter((p) => p.name.toLowerCase().includes(query)) : products;

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Recherche produits</h1>
        <form className="flex flex-col gap-3 md:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Ex: Scanner, monitoring..."
            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
            Rechercher
          </button>
        </form>
        <p className="text-sm text-slate-600">
          Résultats affichés : {results.length} — pagination et filtres seront gérés via l&apos;API.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {results.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-primary"
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

