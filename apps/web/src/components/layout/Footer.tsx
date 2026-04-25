"use client";

import Link from "next/link";
import { useT } from "@/context/LocaleContext";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  const t = useT();
  const featureKeys = [
    "footer.feature.checkout",
    "footer.feature.tracking",
    "footer.feature.support",
    "footer.feature.security",
  ] as const;

  return (
    <footer className="mt-16 bg-foreground text-foreground/20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
        {/* Marque + réassurance */}
        <div className="order-1 space-y-3 border-b border-white/10 pb-8 sm:border-0 sm:pb-0 lg:order-1">
          <p className="font-heading text-lg font-semibold text-white">Althea Systems</p>
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} Althea Systems. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-2 text-sm text-white/75">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <span>{t("footer.support")}</span>
          </div>
        </div>

        {/* Réseaux — 2e sur mobile, dernière colonne sur desktop */}
        <div className="order-2 space-y-3 border-b border-white/10 pb-8 sm:border-0 sm:pb-0 lg:order-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
            {t("social.followUs")}
          </span>
          <SocialLinks variant="dark" />
        </div>

        <div className="order-3 space-y-3 border-b border-white/10 pb-8 sm:border-0 sm:pb-0 lg:order-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
            {t("footer.featuresTitle")}
          </span>
          <ul className="space-y-2 text-sm text-white/85">
            {featureKeys.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-hover"
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <nav
          aria-label={t("footer.legal")}
          className="order-4 flex flex-col gap-2 text-sm text-white/80 lg:order-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
            {t("footer.legal")}
          </span>
          <Link
            href="/legal/cgu"
            className="rounded-md py-1 transition-colors hover:text-primary-hover focus:text-primary-hover focus:outline-none"
          >
            {t("footer.cgu")}
          </Link>
          <Link
            href="/legal/mentions"
            className="rounded-md py-1 transition-colors hover:text-primary-hover focus:text-primary-hover focus:outline-none"
          >
            {t("footer.legal")}
          </Link>
          <Link
            href="/contact"
            className="rounded-md py-1 transition-colors hover:text-primary-hover focus:text-primary-hover focus:outline-none"
          >
            {t("footer.contact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
