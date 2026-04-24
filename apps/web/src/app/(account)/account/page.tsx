import Link from "next/link";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { getTranslations } from "@/lib/translations";

export default async function AccountPage() {
  const locale = await getLocaleFromCookie();
  const t = getTranslations(locale);

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("account.title")}</h1>
        <p className="text-sm text-foreground/70">
          {t("account.subtitle")}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/orders" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-foreground">{t("header.cart")}</p>
          <p className="text-sm text-foreground/70">{t("account.subtitle")}</p>
        </Link>
        <Link href="/settings" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-foreground">{t("header.langLabel")}</p>
          <p className="text-sm text-foreground/70">{t("account.subtitle")}</p>
        </Link>
      </div>
    </div>
  );
}
