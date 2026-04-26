import Image from "next/image";
import Link from "next/link";
import type { Product } from "@bootstrap/types";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

function isOutOfStock(p: Product) {
  return p.status === "out_of_stock" || (p.stock !== undefined && p.stock <= 0);
}

export async function ProductCatalogListing({ products }: { products: Product[] }) {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);
  const statusLabels: Record<Product["status"], string> = {
    in_stock: t("products.status.in_stock"),
    low_stock: t("products.status.low_stock"),
    out_of_stock: t("products.status.out_of_stock"),
    new: t("products.status.new"),
  };
  const viewDetail = t("products.viewDetail");
  const noImage = t("products.noImage");
  const featuredLabel = t("products.featuredBadge");

  return (
    <>
      {/* Mobile: vertical list */}
      <ul className="aso-anim-stagger flex flex-col gap-3 md:hidden" role="list">
        {products.map((product) => {
          const oos = isOutOfStock(product);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-disabled={oos}
                className={`flex gap-4 rounded-xl border border-foreground/10 bg-white p-3 shadow-sm transition ${
                  oos
                    ? "cursor-not-allowed opacity-55 grayscale"
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
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-foreground/50">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="truncate text-xs text-foreground/60">{product.sku}</p>
                  {product.category?.name && (
                    <p className="truncate text-[11px] font-medium text-primary/90">{product.category.name}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        oos ? "bg-foreground/10 text-foreground/70" : "bg-success/10 text-success"
                      }`}
                    >
                      {statusLabels[product.status]}
                    </span>
                    {product.featured && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-primary"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-2.5 w-2.5">
                          <path d="M8 1.5l1.95 4.07 4.5.55-3.3 3.04.83 4.43L8 11.4l-3.98 2.19.83-4.43-3.3-3.04 4.5-.55L8 1.5Z" />
                        </svg>
                        {featuredLabel}
                      </span>
                    )}
                    <span className="text-sm font-bold text-primary">
                      {(product.priceCents / 100).toFixed(2)} {product.currency}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/70">{product.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: grid with image */}
      <ul className="aso-anim-stagger hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3" role="list">
        {products.map((product) => {
          const oos = isOutOfStock(product);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-disabled={oos}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-sm transition ${
                  oos
                    ? "cursor-not-allowed opacity-55 grayscale"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative aspect-16/10 w-full shrink-0 bg-background">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-foreground/50">{noImage}</div>
                  )}
                  {product.category?.name && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {product.category.name}
                    </span>
                  )}
                  {product.featured && (
                    <span
                      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                      style={{ color: "#fff" }}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-2.5 w-2.5">
                        <path d="M8 1.5l1.95 4.07 4.5.55-3.3 3.04.83 4.43L8 11.4l-3.98 2.19.83-4.43-3.3-3.04 4.5-.55L8 1.5Z" />
                      </svg>
                      {featuredLabel}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-foreground group-hover:text-primary">{product.name}</p>
                    <span className="shrink-0 text-[10px] font-mono text-foreground/50">{product.sku}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        oos ? "bg-foreground/10 text-foreground/70" : "bg-background text-foreground/80"
                      }`}
                    >
                      {statusLabels[product.status]}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {(product.priceCents / 100).toFixed(2)} {product.currency}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-foreground/70">{product.description}</p>
                  <span className="mt-auto pt-1 text-xs font-semibold text-primary group-hover:underline">
                    {viewDetail}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
