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
    <footer className="bg-foreground text-foreground/20 mt-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:items-start">
        <div className="space-y-3">
          <p className="font-heading text-lg font-semibold text-white">Althea Systems</p>
          <p className="text-sm text-foreground/40">
            © {new Date().getFullYear()} Althea Systems. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-2 text-sm text-foreground/40">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <span>{t("footer.support")}</span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {t("footer.featuresTitle")}
          </span>
          <ul className="space-y-2 text-sm text-white/80">
            {featureKeys.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-primary-hover"
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal links — visible on desktop, hidden on mobile (already in burger menu) */}
        <nav
          aria-label={t("footer.legal")}
          className="hidden flex-col gap-2 text-sm text-foreground/40 md:flex"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            {t("footer.legal")}
          </span>
          <Link href="/legal/cgu" className="hover:text-primary-hover focus:outline-none focus:text-primary-hover transition-colors">
            {t("footer.cgu")}
          </Link>
          <Link href="/legal/mentions" className="hover:text-primary-hover focus:outline-none focus:text-primary-hover transition-colors">
            {t("footer.legal")}
          </Link>
          <Link href="/contact" className="hover:text-primary-hover focus:outline-none focus:text-primary-hover transition-colors">
            {t("footer.contact")}
          </Link>
        </nav>

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            {t("social.followUs")}
          </span>
          <SocialLinks variant="dark" />
        </div>
      </div>
    </footer>
  );
}
