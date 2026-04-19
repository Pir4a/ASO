import { getCategories } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";
import { CategoryIndexHero } from "@/components/category/CategoryIndexHero";
import { CategoryListingCards } from "@/components/category/CategoryListingCards";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-10">
      <CategoryIndexHero title={t("categories.title")} subtitle={t("categories.subtitle")} />

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/80 py-12 text-center text-sm text-slate-500">
          Aucune catégorie pour le moment.
        </p>
      ) : (
        <CategoryListingCards categories={categories} />
      )}
    </div>
  );
}
