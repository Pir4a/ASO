import Link from "next/link";
import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { TopProducts } from "@/components/home/TopProducts";
import { getHomepageData } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function Home() {
  const { categories, products, featuredProducts, slides, homepageText } = await getHomepageData();
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  const topProducts = (featuredProducts.length > 0 ? featuredProducts : products).slice(0, 8);

  return (
    <div className="space-y-12">
      {/* ─── 3-section hero carousel (admin-editable) ─── */}
      <section aria-label={t("home.carousel")}>
        <Carousel slides={slides} />
      </section>

      {/* ─── Fixed editable text band (admin-editable) ─── */}
      {homepageText && (homepageText.headline || homepageText.body) && (
        <section
          aria-label={homepageText.headline || t("home.infoFallback")}
          className="grid items-center gap-5 rounded-xl border border-foreground/10 border-l-4 border-l-primary bg-white p-6 md:grid-cols-[44px_1fr_auto] md:gap-6 md:p-7"
        >
          <div
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-xl bg-background text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
          </div>
          <div>
            {homepageText.headline && (
              <p className="font-heading text-base font-semibold text-foreground">
                {homepageText.headline}
              </p>
            )}
            {homepageText.body && (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground/70">
                {homepageText.body}
              </p>
            )}
          </div>
          <ul className="flex justify-around gap-6 border-t border-foreground/10 pt-4 text-center md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <li>
              <p className="font-heading text-lg font-semibold text-foreground leading-tight">
                {products.length}+
              </p>
              <p className="text-[11px] uppercase tracking-wide text-foreground/60">{t("home.statsRefs")}</p>
            </li>
            <li>
              <p className="font-heading text-lg font-semibold text-foreground leading-tight">48 h</p>
              <p className="text-[11px] uppercase tracking-wide text-foreground/60">{t("home.statsDelivery")}</p>
            </li>
            <li>
              <p className="font-heading text-lg font-semibold text-foreground leading-tight">24/7</p>
              <p className="text-[11px] uppercase tracking-wide text-foreground/60">{t("home.statsSupport")}</p>
            </li>
          </ul>
        </section>
      )}

      {/* ─── Categories grid (admin-editable order/image/name) ─── */}
      <section aria-labelledby="cat-title">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
              {t("home.exploreByCategory")}
            </p>
            <h2 id="cat-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[26px]">
              {t("home.shopBy")}
            </h2>
          </div>
          <Link
            href="/categories"
            className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-hover sm:inline-flex"
          >
            {t("home.viewAllCategories")}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 8h10m-3-3 3 3-3 3" />
            </svg>
          </Link>
        </header>
        <CategoryGrid categories={categories} />
      </section>

      {/* ─── Top Produits du moment (admin-curated) ─── */}
      <section aria-labelledby="top-title">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
              {t("home.showcaseSelection")}
            </p>
            <h2 id="top-title" className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[26px]">
              {t("home.topProducts")}
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-hover sm:inline-flex"
          >
            {t("home.viewFullCatalog")}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 8h10m-3-3 3 3-3 3" />
            </svg>
          </Link>
        </header>
        <TopProducts products={topProducts} />
      </section>
    </div>
  );
}
