import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductGridClient } from "@/components/home/ProductGridClient";
import { getHomepageData } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function Home() {
  const { categories, products, featuredProducts, slides, homepageText } = await getHomepageData();
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  const bestSellers = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  return (
    <div className="space-y-10">
      <section className="py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-bold text-primary shadow-sm ring-1 ring-foreground/50">
              {t("home.badge")}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {t("home.headline")}
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-2xl">
              {t("home.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm">
                {t("home.tag1")}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm">
                {t("home.tag2")}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground/80 shadow-sm">
                {t("home.tag3")}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-foreground/10">
            <h3 className="mb-4 font-bold text-foreground">{t("home.whyUs")}</h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                {t("home.reason1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                {t("home.reason2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                {t("home.reason3")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                {t("home.reason4")}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{t("home.carousel")}</h2>
          <p className="text-sm text-foreground/70">{t("home.carouselSub")}</p>
        </div>
        <Carousel slides={slides} />

        {homepageText && (homepageText.headline || homepageText.body) && (
          <div className="mt-4 rounded-2xl bg-linear-to-br from-primary/5 to-transparent p-5 ring-1 ring-primary/10">
            {homepageText.headline && (
              <p className="text-base font-semibold text-foreground">{homepageText.headline}</p>
            )}
            {homepageText.body && (
              <p className="mt-1 text-sm text-foreground/70">{homepageText.body}</p>
            )}
          </div>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{t("home.shopBy")}</h2>
          <p className="text-sm text-foreground/70">{t("home.shopBySub")}</p>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{t("home.bestSellers")}</h2>
          <p className="text-sm text-foreground/70">{t("home.bestSellersSub")}</p>
        </div>
        <ProductGridClient products={bestSellers} />
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{t("home.readyOrder")}</p>
            <p className="text-sm text-foreground/70">{t("home.readyOrderSub")}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/checkout"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              {t("home.checkout")}
            </a>
            <a
              href="/contact"
              className="rounded-md border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
            >
              {t("home.talkExpert")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
