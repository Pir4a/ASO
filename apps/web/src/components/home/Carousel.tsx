import Image from "next/image";
import Link from "next/link";
import { CarouselSlide } from "@bootstrap/types";

export function Carousel({ slides }: { slides: CarouselSlide[] }) {
  if (!slides || slides.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
        Aucune diapositive pour le moment.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {slides.map((slide) => {
        const href = slide.href && slide.href.trim().length > 0 ? slide.href : null;
        const Wrapper: React.ElementType = href ? Link : "div";
        const wrapperProps = href ? { href } : {};

        return (
          <Wrapper
            key={slide.id}
            {...wrapperProps}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition ${
              href ? "hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary" : ""
            }`}
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
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="text-sm font-semibold text-slate-900">{slide.title}</p>
              {slide.subtitle && (
                <p className="text-xs text-slate-600">{slide.subtitle}</p>
              )}
              {href && (
                <span className="mt-2 inline-flex w-max items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                  {slide.ctaLabel || "En savoir plus"}
                  <span aria-hidden="true">→</span>
                </span>
              )}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
