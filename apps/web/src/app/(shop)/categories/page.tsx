import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CategoryListingCards } from "@/components/category/CategoryListingCards";

export default async function CategoriesPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  // Order by BO `order` ascending (priority).
  const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const productCounts: Record<string, number> = {};
  for (const c of categories) {
    productCounts[c.slug] = allProducts.filter((p) => p.categoryId === c.id).length;
  }

  const stats = [
    { value: String(categories.length), label: "Spécialités" },
    { value: String(allProducts.length), label: "Produits" },
    { value: "48 h", label: "Livraison" },
  ];

  return (
    <div className="space-y-7">
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">Catégories</span>
      </nav>

      <CategoryHero
        eyebrow="Catalogue"
        name={t("categories.title")}
        description={t("categories.subtitle")}
        stats={stats}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-heading text-[22px] font-semibold tracking-tight text-foreground">
          Toutes les spécialités
        </h2>
        <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white px-3 py-1.5 text-[12.5px] text-foreground/75">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
          <b className="font-semibold text-foreground">{categories.length}</b>
          catégorie{categories.length > 1 ? "s" : ""} active{categories.length > 1 ? "s" : ""}
        </span>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-foreground/10 bg-white/80 py-12 text-center text-sm text-foreground/60">
          Aucune catégorie pour le moment.
        </p>
      ) : (
        <CategoryListingCards categories={sortedCategories} productCounts={productCounts} />
      )}
    </div>
  );
}
