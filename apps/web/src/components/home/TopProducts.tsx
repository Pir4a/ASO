import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export async function TopProducts({ products }: { products: Product[] }) {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/15 bg-white py-12 text-center text-sm text-foreground/50">
        {t("products.featuredEmpty")}
      </p>
    );
  }

  const featuredLabel = t("products.featuredBadge");

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
            {product.featured && (
              <span
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm"
                style={{ color: "#fff" }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-2.5 w-2.5">
                  <path d="M8 1.5l1.95 4.07 4.5.55-3.3 3.04.83 4.43L8 11.4l-3.98 2.19.83-4.43-3.3-3.04 4.5-.55L8 1.5Z" />
                </svg>
                {featuredLabel}
              </span>
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
