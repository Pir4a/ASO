"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useT } from "@/context/LocaleContext";
import { useCart } from "@/hooks/useCart";
import type { Locale } from "@/lib/i18n.shared";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const t = useT();
  const { items } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:gap-6 lg:px-8">
          {/* Burger (mobile only) */}
          <button
            type="button"
            aria-label={t("a11y.openMenu")}
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 text-foreground/80 hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
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
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          {/* Logo — clickable to homepage */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary lg:mr-2"
            aria-label="Althea Systems"
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={48}
              height={48}
              priority
              className="h-10 w-auto"
            />
            <span className="hidden font-heading text-xl font-semibold leading-none tracking-tight text-foreground lg:inline">
              Althea Systems
            </span>
            <span className="sr-only">{t("header.tagline")}</span>
          </Link>

          {/* Search bar — hidden on small screens, shown in burger menu instead */}
          <div className="hidden max-w-xl flex-1 md:block">
            <HeaderSearchBar />
          </div>

          {/* Navigation */}
          <nav
            aria-label={t("header.primaryNav")}
            className="hidden items-center gap-5 md:flex"
          >
            <Link href="/categories" className="text-sm font-medium text-foreground/70 hover:text-primary focus:outline-none focus:text-primary transition-colors">
              {t("header.categories")}
            </Link>
            <Link href="/products" className="text-sm font-medium text-foreground/70 hover:text-primary focus:outline-none focus:text-primary transition-colors">
              {t("header.products")}
            </Link>
            <Link href="/contact" className="text-sm font-medium text-foreground/70 hover:text-primary focus:outline-none focus:text-primary transition-colors">
              {t("header.contact")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={
                itemCount > 0
                  ? `${t("header.cart")}, ${itemCount} ${t("a11y.cartItems")}`
                  : `${t("header.cart")}, ${t("a11y.cartEmpty")}`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span className="hidden sm:inline">{t("header.cart")}</span>
              {itemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <div className="hidden md:block">
              <LocaleSwitcher value={locale} />
            </div>

            <div className="hidden md:flex md:items-center md:gap-2 md:border-l md:border-foreground/10 md:pl-3 lg:pl-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/orders"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    {t("header.orders")}
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-lg bg-background px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    {user?.email?.split("@")[0]}
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      href="/backoffice"
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    >
                      {t("header.admin")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/60 hover:bg-error/10 hover:text-error focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    {t("header.login")}
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    {t("header.signup")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div id="mobile-menu">
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} locale={locale} />
      </div>
    </>
  );
}
