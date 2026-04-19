import Image from "next/image";
import Link from "next/link";
import type { Product } from "@bootstrap/types";

export function RelatedProducts({ products, categoryName }: { products: Product[]; categoryName?: string }) {
  if (!products.length) return null;

  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Dans la même catégorie</h2>
        {categoryName ? (
          <p className="text-sm text-slate-600">Suggestions autour de « {categoryName} »</p>
        ) : (
          <p className="text-sm text-slate-600">Autres produits pour vous</p>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {products.map((p) => {
          const oos = p.status === "out_of_stock" || (p.stock !== undefined && p.stock <= 0);
          return (
            <li key={p.id}>
              <Link
                href={`/products/${p.slug}`}
                className={`group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition ${
                  oos ? "opacity-60 grayscale" : "hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {p.thumbnailUrl ? (
                    <Image src={p.thumbnailUrl} alt={p.name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {(p.priceCents / 100).toFixed(2)} {p.currency}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
