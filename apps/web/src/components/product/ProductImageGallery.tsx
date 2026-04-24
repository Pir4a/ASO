"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ProductImageGalleryProps = {
  productName: string;
  images: string[];
};

export function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const safe = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [safe.join("|")]);

  const current = safe[index] ?? "";

  const go = useCallback(
    (dir: -1 | 1) => {
      if (safe.length <= 1) return;
      setIndex((i) => (i + dir + safe.length) % safe.length);
    },
    [safe.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!current) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-background text-sm text-foreground/60">
        Image à venir
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-background ring-1 ring-foreground/80">
        <Image
          src={current}
          alt={`${productName} — visuel ${index + 1} sur ${safe.length}`}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover"
          priority={index === 0}
        />
        {safe.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-2 py-2 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/80"
              aria-label="Image précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-2 py-2 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/80"
              aria-label="Image suivante"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
              {safe.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}
                  aria-label={`Afficher l’image ${i + 1}`}
                  aria-current={i === index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {safe.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" role="list">
          {safe.map((url, i) => (
            <li key={`${url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-16 w-20 overflow-hidden rounded-lg ring-2 transition ${
                  i === index ? "ring-primary" : "ring-transparent hover:ring-foreground/20"
                }`}
                aria-label={`Miniature ${i + 1}`}
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
