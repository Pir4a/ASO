import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductGridClient } from "@/components/home/ProductGridClient";
import { getHomepageData } from "@/lib/api";

export default async function Home() {
  const { categories, products, slides } = await getHomepageData();

  return (
    <div className="space-y-10">
      <section className="py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-bold text-primary shadow-sm ring-1 ring-slate-200/50">
              Mobile-first • SEO • <span className="ml-1 text-success">Performances &lt;100ms</span>
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Plateforme e-commerce médicale, prête pour l&apos;international.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Refonte Althea Systems : catalogue produits, panier/checkout, backoffice, chatbot
              contact. Architecture Next.js (SSR/ISR), NestJS API sécurisée, PostgreSQL.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm">
                Temps de chargement &lt;100ms
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                SEO &amp; hreflang
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                RGPD + a11y
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
            <h3 className="mb-4 font-bold text-foreground">Stack Technique</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Next.js 16 (SSR/ISR, i18n)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                NestJS API modulaire
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                PostgreSQL transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Sécurité : XSS/CSRF
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Carrousel éditable</h2>
          <p className="text-sm text-slate-600">Modifiable depuis le backoffice.</p>
        </div>
        <Carousel slides={slides} />
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Catégories mises en avant</h2>
          <p className="text-sm text-slate-600">Ordre éditable depuis le backoffice.</p>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Top produits du moment</h2>
          <p className="text-sm text-slate-600">Sélection backoffice, grilles optimisées.</p>
        </div>
        <ProductGridClient products={products} />
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">Prêt pour le checkout sécurisé.</p>
            <p className="text-sm text-slate-600">
              RGPD, paiements extensibles, logs et monitoring activables.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/checkout"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              Lancer le checkout
            </a>
            <a
              href="/contact"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary"
            >
              Contacter l&apos;équipe
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
