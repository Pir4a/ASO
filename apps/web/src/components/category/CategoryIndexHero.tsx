type CategoryIndexHeroProps = {
  title: string;
  subtitle: string;
  /** Small label above the title (e.g. « Catalogue », « Boutique »). */
  eyebrow?: string;
  /** For accessibility: id on the `<h1>`. */
  headingId?: string;
};

/** Page-level hero for shop listing pages (e.g. /categories, /products). */
export function CategoryIndexHero({
  title,
  subtitle,
  eyebrow = "Catalogue",
  headingId = "categories-index-heading",
}: CategoryIndexHeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl ring-1 ring-foreground/80"
      aria-labelledby={headingId}
    >
      <div className="absolute inset-0 bg-foreground" />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />
      <div className="relative px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{eyebrow}</p>
        <h1 id={headingId} className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
