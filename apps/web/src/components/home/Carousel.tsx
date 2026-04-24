"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CarouselSlide } from "@bootstrap/types";
import { useT } from "@/context/LocaleContext";

const AUTOPLAY_MS = 6000;
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

  // Autoplay — respects reduced-motion and pauses on hover/focus
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  // Keyboard navigation when the carousel region has focus
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
      <p className="rounded-3xl border border-dashed border-foreground/10 bg-background py-16 text-center text-sm text-foreground/50">
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
      className="relative overflow-hidden rounded-3xl bg-foreground/5 shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div
        aria-live="polite"
        className="relative h-[320px] w-full md:h-[420px] lg:h-[480px]"
      >
        {slides.map((slide, i) => {
          const isActive = i === index;
          const href = slide.href && slide.href.trim().length > 0 ? slide.href : null;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/30 to-transparent"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-6 md:p-10">
                <p className="max-w-2xl font-heading text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                  {slide.title}
                </p>
                {slide.subtitle && (
                  <p className="max-w-xl text-sm text-white/85 md:text-base">
                    {slide.subtitle}
                  </p>
                )}
                {href && (
                  <Link
                    href={href}
                    tabIndex={isActive ? 0 : -1}
                    className="pointer-events-auto mt-2 inline-flex w-max cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {slide.ctaLabel || t("home.carouselDefaultCta")}
                    <span aria-hidden="true" className="rtl:hidden">
                      →
                    </span>
                    <span aria-hidden="true" className="hidden rtl:inline">
                      ←
                    </span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={t("a11y.carouselPrev")}
            tabIndex={-1}
            className="absolute inset-y-0 start-0 z-10 w-1/2 cursor-w-resize bg-transparent focus:outline-none rtl:cursor-e-resize"
          >
            <span className="sr-only">{t("a11y.carouselPrev")}</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("a11y.carouselNext")}
            tabIndex={-1}
            className="absolute inset-y-0 end-0 z-10 w-1/2 cursor-e-resize bg-transparent focus:outline-none rtl:cursor-w-resize"
          >
            <span className="sr-only">{t("a11y.carouselNext")}</span>
          </button>

          <button
            type="button"
            onClick={prev}
            aria-label={t("a11y.carouselPrev")}
            className="absolute top-1/2 start-3 z-30 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary md:start-5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5 rtl:rotate-180"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("a11y.carouselNext")}
            className="absolute top-1/2 end-3 z-30 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary md:end-5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5 rtl:rotate-180"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center gap-2">
            {slides.map((slide, i) => {
              const isActive = i === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${t("a11y.carouselGoToSlide")} ${i + 1}`}
                  aria-current={isActive}
                  className={`h-2 cursor-pointer rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    isActive ? "w-6 bg-primary" : "w-2 bg-white/70 hover:bg-white"
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
