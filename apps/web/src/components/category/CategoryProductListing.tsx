import Image from "next/image";
import Link from "next/link";
import type { Product } from "@bootstrap/types";

const statusLabels: Record<Product["status"], string> = {
  in_stock: "En stock",
  low_stock: "Stock faible",
  out_of_stock: "Rupture",
  new: "Nouveau",
};

function isOutOfStock(p: Product) {
  return p.status === "out_of_stock" || (p.stock !== undefined && p.stock <= 0);
}

export function CategoryProductListing({ products }: { products: Product[] }) {
  return (
    <>
      {/* Mobile: vertical list */}
      <ul className="flex flex-col gap-3 md:hidden" role="list">
        {products.map((product) => {
          const oos = isOutOfStock(product);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-disabled={oos}
                className={`flex gap-4 rounded-xl border border-foreground/10 bg-white p-3 shadow-sm transition ${
                  oos
                    ? "pointer-events-none cursor-not-allowed opacity-55 grayscale"
                    : "hover:border-primary/40 hover:shadow-md"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-background">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/50">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="truncate text-xs text-foreground/60">{product.sku}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        oos ? "bg-foreground/10 text-foreground/70" : "bg-success/10 text-success"
                      }`}
                    >
                      {statusLabels[product.status]}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {(product.priceCents / 100).toFixed(2)} {product.currency}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: grid */}
      <ul className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3" role="list">
        {products.map((product) => {
          const oos = isOutOfStock(product);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-disabled={oos}
                className={`group block rounded-xl border border-foreground/10 bg-white p-4 shadow-sm transition ${
                  oos
                    ? "pointer-events-none cursor-not-allowed opacity-55 grayscale"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-background">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-foreground/60">
                      Image à venir
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="truncate text-xs text-foreground/60">{product.sku}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      oos ? "bg-foreground/10 text-foreground/70" : "bg-background text-foreground/80"
                    }`}
                  >
                    {statusLabels[product.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {(product.priceCents / 100).toFixed(2)} {product.currency}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
