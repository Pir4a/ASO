type Stat = { value: string; label: string };

type CategoryIndexHeroProps = {
  title: string;
  subtitle: string;
  /** Small label above the title (e.g. « Catalogue », « Boutique »). */
  eyebrow?: string;
  /** For accessibility: id on the `<h1>`. */
  headingId?: string;
  /** Optional stats strip rendered under the subtitle. */
  stats?: Stat[];
};

/** Page-level hero for shop listing pages (e.g. /categories, /products). */
export function CategoryIndexHero({
  title,
  subtitle,
  eyebrow = "Catalogue",
  headingId = "categories-index-heading",
  stats,
}: CategoryIndexHeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-[18px] bg-gradient-to-br from-foreground to-[#00253a] px-7 py-12 text-white md:px-12 md:py-14"
      aria-labelledby={headingId}
    >
      {/* Radial teal highlights */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(0, 168, 181, 0.45) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 0% 100%, rgba(0, 168, 181, 0.18) 0%, transparent 55%)",
        }}
      />
      {/* Diagonal stripes circle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-10 -top-10 h-[280px] w-[280px] rounded-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 12px, transparent 12px 24px)",
        }}
      />

      <div className="relative max-w-[720px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#b3eef2]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          {eyebrow}
        </span>
        <h1
          id={headingId}
          className="mt-4 font-heading text-[40px] font-semibold leading-[1.05] tracking-tight text-white md:text-[56px]"
        >
          {title}
        </h1>
        <p className="mt-3 max-w-[580px] text-base leading-relaxed text-white/80 md:text-[16px]">
          {subtitle}
        </p>

        {stats && stats.length > 0 && (
          <ul
            className="mt-7 flex flex-wrap items-center gap-x-0 gap-y-3 border-t border-white/15 pt-6"
            role="list"
          >
            {stats.map((s, i) => (
              <li
                key={s.label}
                className={`pe-8 ${i < stats.length - 1 ? "me-8 border-e border-white/15" : ""}`}
              >
                <p className="font-heading text-[28px] font-semibold leading-none tabular-nums text-white">
                  {s.value}
                </p>
                <p className="mt-1 text-[11.5px] font-medium uppercase tracking-[0.12em] text-white/65">
                  {s.label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
