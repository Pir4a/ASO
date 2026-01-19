import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";

const statusLabels: Record<Product["status"], string> = {
  in_stock: "En stock",
  low_stock: "Stock faible",
  out_of_stock: "Rupture",
  new: "Nouveau",
};

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50">
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                Image à venir
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-slate-500">{product.sku}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
              {statusLabels[product.status]}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-primary">
            {(product.priceCents / 100).toFixed(2)} {product.currency}
          </p>
        </Link>
      ))}
    </div>
  );
}

