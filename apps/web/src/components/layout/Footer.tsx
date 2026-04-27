"use client";

import Link from "next/link";
import { useT } from "@/context/LocaleContext";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  const t = useT();

  return (
    <footer className="mt-16 bg-foreground text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:items-start">
        <div className="space-y-3">
          <p className="font-heading text-lg font-semibold text-white">Althea Systems</p>
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} Althea Systems. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
            <span>{t("footer.support")}</span>
          </div>
        </div>

        {/* Legal links — visible on desktop, hidden on mobile (already in burger menu) */}
        <nav
          aria-label={t("footer.legal")}
          className="hidden flex-col gap-2 text-sm text-white/70 md:flex"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
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
          <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {t("social.followUs")}
          </span>
          <SocialLinks variant="dark" />
        </div>
      </div>
    </footer>
  );
}
