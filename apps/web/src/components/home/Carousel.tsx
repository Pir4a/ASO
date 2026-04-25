"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CarouselSlide } from "@bootstrap/types";
import { useT } from "@/context/LocaleContext";

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD_PX = 40;

export function Carousel({ slides }: { slides: CarouselSlide[] }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const count = slides?.length ?? 0;
  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [prev, next, count]);

  if (count === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-foreground/15 bg-white py-16 text-center text-sm text-foreground/50">
        {t("home.carouselEmpty")}
      </p>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? startX) - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("a11y.carouselRegion")}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative overflow-hidden rounded-2xl bg-foreground shadow-[0_8px_28px_rgba(0,61,92,0.18)] focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div aria-live="polite" className="relative h-[340px] w-full md:h-[400px] lg:h-[440px]">
        {slides.map((slide, i) => {
          const isActive = i === index;
          const href = slide.href && slide.href.trim().length > 0 ? slide.href : null;
          const tone = i % 2 === 0 ? "navy" : "teal";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isActive ? "opacity-100" : "pointer-events-none translate-x-10 opacity-0"
              }`}
            >
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
                  className="object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 ${
                    tone === "navy"
                      ? "bg-[linear-gradient(135deg,#003d5c_0%,#00557e_100%)]"
                      : "bg-[linear-gradient(135deg,#00a8b5_0%,#33bfc9_100%)]"
                  }`}
                />
              )}

              {/* Bottom-up gradient just behind text — keeps the photo readable on top */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 pt-10 md:px-14 md:pb-14 lg:px-16">
                <div className="max-w-2xl">
                  <span className="mb-3 inline-block rounded-sm border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {t("home.carousel")}
                  </span>
                  <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 md:text-base">
                      {slide.subtitle}
                    </p>
                  )}
                  {href && (
                    <Link
                      href={href}
                      tabIndex={isActive ? 0 : -1}
                      className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-heading text-sm font-semibold text-foreground shadow-sm transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      {slide.ctaLabel || t("home.carouselDefaultCta")}
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      >
                        <path d="M3 8h10m-3-3 3 3-3 3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          {/* Top-right arrow controls */}
          <div className="absolute right-5 top-5 z-30 flex gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label={t("a11y.carouselPrev")}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M13 8H3m3-3-3 3 3 3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("a11y.carouselNext")}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M3 8h10m-3-3 3 3-3 3" />
              </svg>
            </button>
          </div>

          {/* Bottom-right dots (kept out of the text/CTA area on the left) */}
          <div className="absolute bottom-5 end-6 z-30 flex gap-2">
            {slides.map((slide, i) => {
              const isActive = i === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${t("a11y.carouselGoToSlide")} ${i + 1}`}
                  aria-current={isActive}
                  className={`h-1 cursor-pointer rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/60 ${
                    isActive ? "w-11 bg-primary" : "w-7 bg-white/30 hover:bg-white/50"
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
