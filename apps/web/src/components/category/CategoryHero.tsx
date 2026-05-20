"use client";

import Image from "next/image";
import { useT } from "@/context/LocaleContext";

type Stat = { value: string; label: string };

type CategoryHeroProps = {
  name: string;
  description?: string;
  imageUrl?: string;
  productsTotal?: number;
  availableTotal?: number;
  /** Eyebrow label shown above the title (defaults to "Catégorie"). */
  eyebrow?: string;
  /** Optional stats strip rendered on the description band. */
  stats?: Stat[];
  /** Compact variant used to reduce hero height on dense listing pages. */
  compact?: boolean;
};

export function CategoryHero({
  name,
  description,
  imageUrl,
  productsTotal,
  availableTotal,
  eyebrow,
  stats,
  compact = false,
}: CategoryHeroProps) {
  const t = useT();
  const eyebrowLabel = eyebrow ?? t("categories.eyebrow");
  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-[0_8px_28px_rgba(0,61,92,0.08)]">
      {/* Image with overlay title — mandatory per spec */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-foreground via-[#00557e] to-primary ${compact ? "h-[150px] md:h-[180px]" : "h-[220px] md:h-[280px]"}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1240px) 100vw, 1200px"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(212,244,247,0.06)_0_14px,transparent_14px_28px)]"
          />
        )}

        {/* Bottom gradient for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent"
        />

        <div className={`absolute inset-x-0 bottom-0 z-10 px-6 md:px-11 ${compact ? "pb-5 pt-5 md:pb-6 md:pt-6" : "pb-7 pt-8 md:pb-9"}`}>
          <span className={`inline-flex items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm ${compact ? "mb-2" : "mb-3"}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
              <path d="M8 1.5C5 1.5 3 3.5 3 6.5c0 3.5 5 8 5 8s5-4.5 5-8c0-3-2-5-5-5Z" />
              <circle cx="8" cy="6" r="1.5" />
            </svg>
            {eyebrowLabel}
          </span>
          <h1 className={`font-heading font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,37,58,0.3)] ${compact ? "text-[28px] md:text-[34px] lg:text-[36px]" : "text-3xl md:text-[40px] lg:text-[44px]"}`}>
            {name}
          </h1>
          {(productsTotal !== undefined || availableTotal !== undefined) && (
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-background ${compact ? "mt-2" : "mt-3"}`}>
              {productsTotal !== undefined && (
                <span>
                  <b className="font-semibold text-white">{productsTotal}</b>{" "}
                  {productsTotal > 1 ? t("products.referencedMany") : t("products.referencedOne")}
                </span>
              )}
              {productsTotal !== undefined && availableTotal !== undefined && (
                <span aria-hidden="true" className="text-white/40">·</span>
              )}
              {availableTotal !== undefined && (
                <span>
                  <b className="font-semibold text-white">{availableTotal}</b>{" "}
                  {availableTotal > 1 ? t("products.availableMany") : t("products.availableOne")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description band + optional stats */}
      {(description || (stats && stats.length > 0)) && (
        <div className={`grid items-center border-t border-foreground/5 px-6 md:px-8 lg:grid-cols-[44px_1fr_auto] ${compact ? "gap-4 py-4 md:py-5" : "gap-5 py-6 md:py-7"}`}>
          <div
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-xl bg-background text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v.01M11 12h1v4h1" />
            </svg>
          </div>
          {description ? (
            <p className="m-0 text-[14.5px] leading-relaxed text-foreground/75">{description}</p>
          ) : (
            <span aria-hidden="true" />
          )}
          {stats && stats.length > 0 && (
            <ul
              className="flex justify-around gap-6 border-t border-foreground/10 pt-4 text-center lg:justify-end lg:gap-7 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
              role="list"
            >
              {stats.map((s) => (
                <li key={s.label}>
                  <p className="font-heading text-[18px] font-semibold leading-tight text-foreground tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                    {s.label}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
