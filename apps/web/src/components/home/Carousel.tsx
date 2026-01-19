import Image from "next/image";
import Link from "next/link";
import { CarouselSlide } from "@bootstrap/types";

export function Carousel({ slides }: { slides: CarouselSlide[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {slides.map((slide) => (
        <Link
          key={slide.id}
          href={slide.href ?? "#"}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative h-40 w-full">
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-slate-900">{slide.title}</p>
            {slide.subtitle && <p className="text-xs text-slate-600">{slide.subtitle}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

