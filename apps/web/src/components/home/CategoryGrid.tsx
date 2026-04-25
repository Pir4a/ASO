import Image from "next/image";
import Link from "next/link";
import { Category } from "@bootstrap/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-white transition duration-200 hover:-translate-y-1 hover:border-primary-hover hover:shadow-[0_10px_26px_rgba(0,61,92,0.12)] focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="relative h-40 overflow-hidden border-b border-foreground/5 bg-gradient-to-br from-background to-white">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,61,92,0.04)_0_10px,transparent_10px_20px)]"
            />
            {cat.imageUrl ? (
              <Image
                src={cat.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-foreground/10 bg-white text-foreground shadow-[0_4px_14px_rgba(0,61,92,0.08)] transition group-hover:text-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-4 text-center">
            <p className="font-heading text-base font-semibold text-foreground">{cat.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
