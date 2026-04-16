import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function CguPage() {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{t("legal.cgu.title")}</h1>
        <p className="text-sm text-slate-600">{t("legal.cgu.subtitle")}</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-slate-600">
          {t("legal.cgu.subtitle")}
        </p>
      </div>
    </div>
  );
}
