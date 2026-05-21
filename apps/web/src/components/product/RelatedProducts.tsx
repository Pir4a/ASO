"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@bootstrap/types";
import { useT, useLocale } from "@/context/LocaleContext";

function isOutOfStock(p: Product) {
  return p.status === "out_of_stock" || (p.stock !== undefined && p.stock <= 0);
}

function formatProductPrice(p: Product, locale: string) {
  const value = p.priceCents / 100;
  return value >= 1000 ? value.toLocaleString(locale) : value.toFixed(2);
}

const PLACEHOLDER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-12 w-12">
    <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
  </svg>
);

export function RelatedProducts({
  products,
  categoryName,
  categorySlug,
}: {
  products: Product[];
  categoryName?: string;
  categorySlug?: string;
}) {
  const t = useT();
  const locale = useLocale();
  if (!products.length) return null;

  return (
    <section aria-labelledby="related-title">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
            {t("related.eyebrow")}
          </p>
          <h2
            id="related-title"
            className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[26px]"
          >
            {categoryName ? t("related.alsoInCategory", { name: categoryName }) : t("related.youMayAlsoLike")}
          </h2>
        </div>
        {categorySlug && (
          <Link
            href={`/categories/${categorySlug}`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-hover sm:inline-flex"
          >
            {t("related.viewCategory")}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5 rtl:rotate-180">
              <path d="M3 8h10m-3-3 3 3-3 3" />
            </svg>
          </Link>
        )}
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {products.slice(0, 6).map((p) => {
          const oos = isOutOfStock(p);
          return (
            <li key={p.id}>
              <Link
                href={`/products/${p.slug}`}
                aria-disabled={oos}
                className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white transition duration-200 ${
                  oos
                    ? "border-foreground/5 bg-background/40 opacity-80 grayscale"
                    : "border-foreground/10 hover:-translate-y-0.5 hover:border-primary-hover hover:shadow-[0_10px_26px_rgba(0,61,92,0.12)]"
                }`}
                tabIndex={oos ? -1 : 0}
              >
                <div className="relative h-44 overflow-hidden border-b border-foreground/5 bg-gradient-to-br from-background to-white">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,61,92,0.04)_0_10px,transparent_10px_20px)]"
                  />
                  {p.thumbnailUrl ? (
                    <Image
                      src={p.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-primary">{PLACEHOLDER_ICON}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
                  <h3
                    className={`font-heading text-[15.5px] font-semibold leading-snug ${
                      oos ? "text-foreground/55" : "text-foreground"
                    }`}
                  >
                    {p.name}
                  </h3>
                  <p
                    className={`mt-1 font-heading text-[19px] font-bold leading-tight ${
                      oos ? "text-foreground/55" : "text-foreground"
                    }`}
                  >
                    <span className="num tabular-nums">{formatProductPrice(p, locale)}</span>{" "}
                    <span className="text-xs font-medium text-foreground/55">{p.currency}</span>
                  </p>
                  {oos && (
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-error">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                        <circle cx="8" cy="8" r="6" />
                        <path d="m4.5 4.5 7 7" />
                      </svg>
                      {t("products.status.out_of_stock")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
