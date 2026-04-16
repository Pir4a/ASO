"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useT } from "@/context/LocaleContext";
import type { Locale } from "@/lib/i18n.shared";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo — clickable to homepage */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm">
            AS
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-foreground">Althea Systems</p>
            <p className="text-[11px] leading-tight text-foreground/60">{t("header.tagline")}</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/categories" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            {t("header.categories")}
          </Link>
          <Link href="/products" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            {t("header.products")}
          </Link>
          <Link href="/search" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            {t("header.search")}
          </Link>
          <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            {t("header.contact")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary transition-colors"
          >
            {t("header.cart")}
            <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-primary" />
          </Link>

          <LocaleSwitcher value={locale} />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {user?.email?.split("@")[0]}
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/backoffice"
                  className="rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  {t("header.admin")}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                {t("header.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t("header.login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
              >
                {t("header.signup")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
