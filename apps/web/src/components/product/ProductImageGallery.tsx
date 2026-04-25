"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProductImageGalleryProps = {
  productName: string;
  images: string[];
};

const PLACEHOLDER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-14 w-14">
    <path d="M21 7.5 12 3 3 7.5m18 0L12 12M21 7.5v9L12 21M3 7.5 12 12M3 7.5v9L12 21m0-9v9" />
  </svg>
);

export function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const safe = images.filter(Boolean);
  const [rawIndex, setIndex] = useState(0);

  const count = safe.length;
  const index = count > 0 ? ((rawIndex % count) + count) % count : 0;
  const current = safe[index] ?? "";

  const go = (dir: -1 | 1) => {
    if (count <= 1) return;
    setIndex((i) => i + dir);
  };

  useEffect(() => {
    if (count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => i - 1);
      if (e.key === "ArrowRight") setIndex((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-br from-background to-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,61,92,0.04)_0_12px,transparent_12px_24px)]"
        />
        {current ? (
          <Image
            src={current}
            alt={`${productName} — visuel ${index + 1} sur ${safe.length}`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-primary">{PLACEHOLDER_ICON}</div>
        )}

        {safe.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Image précédente"
              className="absolute start-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-4 w-4">
                <path d="M13 8H3m3-3-3 3 3 3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Image suivante"
              className="absolute end-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-4 w-4">
                <path d="M3 8h10m-3-3 3 3-3 3" />
              </svg>
            </button>

            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
              {safe.map((_, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Afficher l'image ${i + 1}`}
                    aria-current={isActive}
                    className={`h-1 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive ? "w-7 bg-primary" : "w-4 bg-foreground/25 hover:bg-foreground/45"
                    }`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {safe.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" role="list">
          {safe.map((url, i) => {
            const isActive = i === index;
            return (
              <li key={`${url}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Miniature ${i + 1}`}
                  aria-current={isActive}
                  className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 transition ${
                    isActive
                      ? "border-primary"
                      : "border-transparent ring-1 ring-foreground/10 hover:border-primary-hover"
                  }`}
                >
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
