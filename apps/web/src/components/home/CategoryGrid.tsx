import Image from "next/image";
import Link from "next/link";
import { Category } from "@bootstrap/types";
import { ArrowRight } from "lucide-react";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {categories.map((cat) => (
        <Link key={cat.id} href={`/products?category=${cat.id}`} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex h-full flex-col">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-50">
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                  Visuel à venir
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Découvrir la gamme</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <ArrowRight className="size-5 -ml-0.5 group-hover:ml-0.5 transition-all" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
