import Image from "next/image";
import Link from "next/link";
import type { Category } from "@bootstrap/types";

/**
 * Rich category cards for /categories.
 * First card spans 2 cols (feature) on large screens.
 */
export function CategoryListingCards({
  categories,
  productCounts = {},
}: {
  categories: Category[];
  productCounts?: Record<string, number>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
      {categories.map((cat, i) => {
        const isFeature = i === 0;
        const count = productCounts[cat.slug] ?? 0;
        const orderTag = `CAT ·${String(cat.order ?? i + 1).padStart(2, "0")}`;
        return (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white transition-all duration-[280ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:border-primary hover:shadow-[0_24px_48px_rgba(0,61,92,0.16)] ${
              isFeature ? "lg:col-span-2" : ""
            }`}
          >
            <div
              className={`relative overflow-hidden bg-foreground ${
                isFeature ? "aspect-[16/10] lg:aspect-[21/10]" : "aspect-[16/10]"
              }`}
            >
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes={
                    isFeature
                      ? "(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 800px"
                      : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  }
                  className="object-cover saturate-[0.95] transition-transform duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00557e] via-foreground to-foreground" />
              )}

              {/* Bottom gradient for legibility of overlaid title */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,37,58,0)_0%,rgba(0,37,58,0)_40%,rgba(0,37,58,0.85)_100%)]"
              />

              {/* Order pill (top-left) */}
              <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold tracking-wide text-foreground backdrop-blur tabular-nums">
                {orderTag.split("·")[0]}
                <span className="text-primary">·{orderTag.split("·")[1]}</span>
              </span>

              {/* Title overlay (bottom of image) */}
              <div className="absolute inset-x-5 bottom-4 z-10 md:inset-x-6">
                <h3
                  className={`m-0 font-heading font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,37,58,0.5)] ${
                    isFeature ? "text-2xl md:text-[32px]" : "text-[22px]"
                  }`}
                >
                  {cat.name}
                </h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3.5 px-5 py-5 md:px-[22px]">
              {cat.description ? (
                <p
                  className={`m-0 leading-[1.55] text-foreground/70 ${
                    isFeature
                      ? "max-w-[640px] text-[14.5px] [-webkit-line-clamp:4]"
                      : "text-[13.5px] [-webkit-line-clamp:3]"
                  } [-webkit-box-orient:vertical] [display:-webkit-box] overflow-hidden`}
                >
                  {cat.description}
                </p>
              ) : (
                <p className="m-0 text-[13.5px] text-foreground/55">
                  Découvrir les produits de cette catégorie.
                </p>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/5 pt-3.5">
                <span className="inline-flex items-baseline gap-1.5 text-sm text-foreground/65">
                  <b className="font-heading text-base font-semibold text-foreground tabular-nums">
                    {count}
                  </b>
                  <span className="text-foreground/55">
                    produit{count > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-[gap] group-hover:gap-2.5">
                  Voir le catalogue
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
