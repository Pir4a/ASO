import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";

export function TopProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/15 bg-white py-12 text-center text-sm text-foreground/50">
        Pas encore de produits vedettes.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-white transition duration-200 hover:-translate-y-1 hover:border-primary-hover hover:shadow-[0_10px_24px_rgba(0,61,92,0.10)] focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="relative h-40 overflow-hidden border-b border-foreground/5 bg-gradient-to-br from-background to-white">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,61,92,0.04)_0_10px,transparent_10px_20px)]"
            />
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-11 w-11">
                  <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
                </svg>
              </div>
            )}
          </div>
          <div className="px-4 py-3.5">
            {product.category?.name && (
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                {product.category.name}
              </p>
            )}
            <p className="mt-1 font-heading text-sm font-semibold leading-snug text-foreground">
              {product.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
