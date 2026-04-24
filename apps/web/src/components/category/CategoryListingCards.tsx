import Image from "next/image";
import Link from "next/link";
import type { Category } from "@bootstrap/types";

/**
 * Rich category cards for /categories: image hero + title overlay + description.
 */
export function CategoryListingCards({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-foreground/80 transition hover:-translate-y-1 hover:shadow-xl hover:ring-primary/25"
        >
          <div className="relative aspect-16/10 w-full shrink-0 bg-foreground">
            {cat.imageUrl ? (
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover opacity-95 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-foreground/60 to-foreground" />
            )}
            <div
              className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 ring-1 ring-white/20">
                  #{cat.order}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-tight text-white drop-shadow-md md:text-xl">{cat.name}</h2>
            </div>
          </div>
          {cat.description ? (
            <p className="line-clamp-3 flex-1 p-4 text-sm leading-relaxed text-foreground/70 md:p-5">{cat.description}</p>
          ) : (
            <p className="flex-1 p-4 text-sm text-foreground/50 md:p-5">Découvrir les produits →</p>
          )}
        </Link>
      ))}
    </div>
  );
}
