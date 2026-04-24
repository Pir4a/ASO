"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useT } from "@/context/LocaleContext";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { SocialLinks } from "./SocialLinks";
import type { Locale } from "@/lib/i18n.shared";
import { useAuth } from "@/context/AuthContext";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}

export function MobileMenu({ open, onClose, locale }: MobileMenuProps) {
  const t = useT();
  const { user, isAuthenticated, logout } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Lock body scroll + focus management + ESC to close
  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the close button when the menu opens so screen readers land inside the dialog
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("header.primaryNav")}
      className="fixed inset-0 z-50 md:hidden"
    >
      <button
        type="button"
        aria-label={t("a11y.closeMenu")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 end-0 flex h-full w-[85%] max-w-sm flex-col gap-4 overflow-y-auto bg-white p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg font-semibold text-foreground">
            Althea Systems
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t("a11y.closeMenu")}
            className="rounded-lg p-2 text-foreground/70 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <HeaderSearchBar onSubmitted={onClose} />

        <nav aria-label={t("header.primaryNav")} className="flex flex-col divide-y divide-foreground/10">
          {[
            { href: "/categories", key: "header.categories" as const },
            { href: "/products", key: "header.products" as const },
            { href: "/search", key: "header.search" as const },
            { href: "/contact", key: "header.contact" as const },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="py-3 text-base font-medium text-foreground hover:text-primary focus:outline-none focus:text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="rounded-lg bg-background p-3">
          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span>{t("header.cart")}</span>
            <span aria-hidden="true">›</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                className="rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {user?.email?.split("@")[0]}
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/backoffice"
                  onClick={onClose}
                  className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {t("header.admin")}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-error hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("header.logout")}
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium text-foreground/80 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("header.login")}
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("header.signup")}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {t("header.langLabel")}
            </span>
            <LocaleSwitcher value={locale} />
          </div>

          <div className="space-y-2 border-t border-foreground/10 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {t("footer.legal")}
            </span>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/legal/cgu" onClick={onClose} className="text-foreground/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                {t("footer.cgu")}
              </Link>
              <Link href="/legal/mentions" onClick={onClose} className="text-foreground/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                {t("footer.legal")}
              </Link>
              <Link href="/contact" onClick={onClose} className="text-foreground/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                {t("footer.contact")}
              </Link>
            </div>
          </div>

          <div className="border-t border-foreground/10 pt-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {t("social.followUs")}
            </span>
            <SocialLinks variant="light" />
          </div>
        </div>
      </div>
    </div>
  );
}
