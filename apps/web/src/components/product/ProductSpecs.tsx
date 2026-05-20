"use client";

import { useT } from "@/context/LocaleContext";

type ProductSpecsProps = {
  specs: Record<string, string>;
};

export function ProductSpecs({ specs }: ProductSpecsProps) {
  const t = useT();
  const entries = Object.entries(specs).filter(([k, v]) => k.trim() && String(v).trim());
  if (entries.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <header className="border-b border-foreground/5 px-6 py-5">
        <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
          {t("product.specsEyebrow")}
        </p>
        <h2 className="font-heading text-[20px] font-semibold tracking-tight text-foreground">
          {t("product.specsTitle")}
        </h2>
      </header>
      <dl className="divide-y divide-foreground/5">
        {entries.map(([key, value], i) => (
          <div
            key={key}
            className={`grid gap-1 px-6 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:items-baseline sm:gap-6 ${
              i % 2 === 1 ? "bg-background/30" : ""
            }`}
          >
            <dt
              dir="auto"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/55"
            >
              {key}
            </dt>
            <dd dir="auto" className="text-[14px] font-medium text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
