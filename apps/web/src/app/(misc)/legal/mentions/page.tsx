import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function MentionsPage() {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("legal.mentions.title")}</h1>
        <p className="text-sm text-foreground/70">{t("legal.mentions.subtitle")}</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-foreground/70">
          {t("legal.mentions.subtitle")}
        </p>
      </div>
    </div>
  );
}
