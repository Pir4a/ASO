import Link from "next/link";
import { getCategories } from "@/lib/api";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t("categories.title")}</h1>
        <p className="text-sm text-slate-600">
          {t("categories.subtitle")}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{cat.name}</p>
              <span className="text-xs text-slate-500">#{cat.order}</span>
            </div>
            <p className="text-sm text-slate-600">{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
