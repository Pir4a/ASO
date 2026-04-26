import Link from "next/link";
import type { Metadata } from "next";
import { getLocaleFromCookie } from "@/lib/i18n.server";
import { isRtl } from "@/lib/i18n.shared";
import { aboutTranslations } from "@/lib/translations";

export const metadata: Metadata = {
  title: "À propos – Althea Systems",
  description:
    "Althea Systems, société française spécialisée en e-commerce de matériel médical : mission, équipe, valeurs et contact.",
};

export default async function AboutPage() {
  const locale = await getLocaleFromCookie();
  const t = aboutTranslations[locale];
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <div dir={dir} className="mx-auto max-w-3xl space-y-4">
      <header className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t.pageTitle}</h1>
        <p className="text-sm text-foreground/70">{t.intro}</p>
      </header>

      <section className="card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{t.missionTitle}</h2>
        <p className="text-sm text-foreground/70">{t.missionBody}</p>
      </section>

      <section className="card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{t.teamTitle}</h2>
        <p className="text-sm text-foreground/70">{t.teamBody}</p>
      </section>

      <section className="card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{t.valuesTitle}</h2>
        <p className="text-sm text-foreground/70">{t.valuesBody}</p>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t.contactTitle}</h2>
        <p className="text-sm text-foreground/70">{t.contactBody}</p>
        <Link
          href="/contact"
          className="inline-flex cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
        >
          {t.contactCta}
        </Link>
      </section>
    </div>
  );
}
