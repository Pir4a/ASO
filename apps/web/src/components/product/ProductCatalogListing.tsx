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
                className={`flex gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition ${
                  oos
                    ? "cursor-not-allowed opacity-55 grayscale"
                    : "hover:border-primary/40 hover:shadow-md"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">{product.sku}</p>
                  {product.category?.name && (
                    <p className="truncate text-[11px] font-medium text-primary/90">{product.category.name}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        oos ? "bg-slate-200 text-slate-600" : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {statusLabels[product.status]}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {(product.priceCents / 100).toFixed(2)} {product.currency}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{product.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: grid with image */}
      <ul className="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-3" role="list">
        {products.map((product) => {
          const oos = isOutOfStock(product);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-disabled={oos}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition ${
                  oos
                    ? "cursor-not-allowed opacity-55 grayscale"
                    : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative aspect-16/10 w-full shrink-0 bg-slate-100">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">{noImage}</div>
                  )}
                  {product.category?.name && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {product.category.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-slate-900 group-hover:text-primary">{product.name}</p>
                    <span className="shrink-0 text-[10px] font-mono text-slate-400">{product.sku}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        oos ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusLabels[product.status]}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {(product.priceCents / 100).toFixed(2)} {product.currency}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-600">{product.description}</p>
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
