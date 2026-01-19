import Image from "next/image";
import Link from "next/link";
import { Category } from "@bootstrap/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{cat.name}</p>
            <span className="text-xs text-slate-500">#{cat.order}</span>
          </div>
          {cat.imageUrl ? (
            <div className="relative h-28 w-full">
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="rounded-lg object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
              Visuel à venir
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

