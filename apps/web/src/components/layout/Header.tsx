"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { Category } from "@bootstrap/types";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LocaleContext";
import { useCart } from "@/hooks/useCart";
import type { Locale } from "@/lib/i18n.shared";
import { MobileMenu } from "./MobileMenu";
import { triggerBoTransition } from "./RouteFlourish";

const API_URL =
  (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
  "http://localhost:3001/api";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { user, isAuthenticated, logout } = useAuth();
  const { items, total, currency } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [searchSlug, setSearchSlug] = useState("");

  useEffect(() => {
    let aborted = false;
    fetch(`${API_URL}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Category[]) => {
        if (!aborted) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalLabel = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format((total || 0) / 100);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const qPart = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
    if (searchSlug) {
      router.push(`/categories/${searchSlug}${qPart}`);
    } else {
      router.push(`/products${qPart}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-white">
        {/* ── Utility strip (navy) ── */}
        <div className="bg-foreground text-white/85">
          <div className="mx-auto flex max-w-[1300px] items-center gap-5 px-4 py-2 text-[12.5px] sm:px-6 lg:px-7 2xl:max-w-[1600px]">
            <ul className="hidden items-center gap-5 md:flex" role="list">
              <li className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3 text-primary-hover">
                  <path d="M1 4h13v9H1V4Zm13 3h4l3 3v3h-7" />
                  <circle cx="5" cy="16" r="1.5" />
                  <circle cx="17" cy="16" r="1.5" />
                </svg>
                Livraison <b className="font-semibold text-white">48 h</b> en France
              </li>
              <li className="hidden items-center gap-1.5 whitespace-nowrap font-medium lg:inline-flex">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3 text-primary-hover">
                  <path d="M12 2 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-5z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Garantie <b className="font-semibold text-white">2 ans</b>
              </li>
              <li className="hidden items-center gap-1.5 whitespace-nowrap font-medium xl:inline-flex">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3 text-primary-hover">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Paiement sécurisé
              </li>
            </ul>

            <div className="ml-auto flex items-center gap-2.5 text-[12.5px] font-medium sm:gap-3.5">
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="hidden text-white/80 transition hover:text-white sm:inline">
                    {t("header.orders")}
                  </Link>
                  <span aria-hidden="true" className="hidden h-3.5 w-px bg-white/20 sm:inline-block" />
                  <Link href="/profile" className="hidden text-white/80 transition hover:text-white md:inline">
                    {user?.email?.split("@")[0]}
                  </Link>
                  {user?.role === "admin" && (
                    <>
                      <span aria-hidden="true" className="hidden h-3.5 w-px bg-white/20 md:inline-block" />
                      <Link
                        href="/backoffice"
                        style={{ color: "#fff" }}
                        className="hidden items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition hover:bg-primary-hover md:inline-flex"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerBoTransition("/backoffice");
                        }}
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3 w-3">
                          <rect x="2" y="2" width="5" height="5" rx="1" />
                          <rect x="9" y="2" width="5" height="5" rx="1" />
                          <rect x="2" y="9" width="5" height="5" rx="1" />
                          <rect x="9" y="9" width="5" height="5" rx="1" />
                        </svg>
                        Backoffice
                      </Link>
                    </>
                  )}
                  <span aria-hidden="true" className="hidden h-3.5 w-px bg-white/20 sm:inline-block" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-white/80 transition hover:text-white"
                  >
                    {t("header.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-white/80 transition hover:text-white">
                    {t("header.login")}
                  </Link>
                  <Link href="/signup" className="font-semibold text-primary-hover transition hover:text-white">
                    {t("header.signup")} →
                  </Link>
                </>
              )}
              <span aria-hidden="true" className="h-3.5 w-px bg-white/20" />
              <LocaleSwitcher value={locale} tone="dark" />
            </div>
          </div>
        </div>

        {/* ── Main bar ── */}
        <div className="mx-auto flex max-w-[1300px] items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 lg:gap-6 lg:px-7 2xl:max-w-[1600px]">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("a11y.openMenu")}
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-lg border border-foreground/10 text-foreground/80 transition hover:border-primary hover:text-primary md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Althea Systems"
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={42}
              height={42}
              priority
              className="h-10 w-auto rounded-[9px]"
            />
            <div className="hidden flex-col leading-none lg:flex">
              <span className="font-heading text-[17px] font-bold tracking-tight text-foreground">
                Althea Systems
              </span>
              <span className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground/55">
                Matériel médical
              </span>
            </div>
          </Link>

          {/* Search */}
          <form
            role="search"
            onSubmit={onSearch}
            className="flex h-11 min-w-0 flex-1 items-stretch overflow-hidden rounded-[10px] border-[1.5px] border-foreground/10 bg-white transition focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(0,168,181,0.12)]"
          >
            {/* Category prefix */}
            <label className="relative hidden min-w-0 items-center border-r border-foreground/10 bg-background/60 transition hover:bg-background sm:inline-flex">
              <span className="sr-only">Catégorie</span>
              <select
                value={searchSlug}
                onChange={(e) => setSearchSlug(e.target.value)}
                className="appearance-none border-0 bg-transparent py-0 pl-3.5 pr-7 text-[13px] font-semibold text-foreground focus:outline-none"
              >
                <option value="">Toutes catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-2.5 text-foreground/55">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-2.5 w-2.5">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </span>
            </label>
            {/* Input */}
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-4">
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.search")}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground placeholder:text-foreground/55 focus:outline-none"
              />
              <kbd className="hidden items-center gap-0.5 rounded border border-foreground/10 bg-background/60 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-foreground/65 lg:inline-flex">
                ⌘K
              </kbd>
            </div>
            {/* Submit */}
            <button
              type="submit"
              aria-label={t("a11y.searchSubmit")}
              className="grid w-12 place-items-center bg-primary text-white transition hover:bg-primary-hover sm:w-14"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </form>

          {/* Cart pill */}
          <Link
            href="/cart"
            style={{ color: "#fff" }}
            className="hidden h-11 items-center gap-3 whitespace-nowrap rounded-full bg-primary pl-4 pr-2 transition hover:bg-primary-hover md:inline-flex"
            aria-label={
              itemCount > 0
                ? `${t("header.cart")}, ${itemCount} ${t("a11y.cartItems")}`
                : `${t("header.cart")}, ${t("a11y.cartEmpty")}`
            }
          >
            <div className="flex flex-col leading-none">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-white/85">
                {t("header.cart")}
              </span>
              <span className="mt-0.5 font-heading text-[14px] font-bold tabular-nums">
                {totalLabel}
              </span>
            </div>
            <span className="relative grid h-[30px] w-[30px] place-items-center rounded-full bg-white text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              {itemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 inline-flex min-w-[16px] justify-center rounded-full border-2 border-primary bg-foreground px-1 text-[10px] font-bold leading-[1.4] text-white tabular-nums"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </span>
          </Link>

          {/* Mobile cart icon */}
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-foreground/10 text-foreground transition hover:border-primary hover:text-primary md:hidden"
            aria-label={t("header.cart")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 inline-flex min-w-[18px] justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[1.4] text-white"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* ── Bottom nav row ── */}
        <div className="hidden border-t border-foreground/5 md:block">
          <div className="mx-auto flex max-w-[1300px] items-center gap-3 px-4 sm:px-6 lg:px-7 2xl:max-w-[1600px]">
            <NavTab href="/" active={isActive("/")}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1H10v-4H6v4H3.5a1 1 0 0 1-1-1V7.5Z" />
              </svg>
              Accueil
            </NavTab>

            <nav aria-label={t("header.primaryNav")} className="flex items-center gap-1.5">
              <NavTab href="/categories" active={isActive("/categories")}>
                {t("header.categories")}
              </NavTab>
              <NavTab href="/products" active={isActive("/products")}>
                {t("header.products")}
              </NavTab>
              <NavTab href="/contact" active={isActive("/contact")}>
                {t("header.contact")}
              </NavTab>
              <NavTab href="/about" active={isActive("/about")}>
                {t("header.about")}
              </NavTab>
            </nav>

            <Link
              href="/profile"
              aria-current={isActive("/profile") ? "page" : undefined}
              style={isActive("/profile") ? { color: "#fff" } : undefined}
              className={`ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                isActive("/profile")
                  ? "bg-foreground hover:bg-[#00253a]"
                  : "bg-background text-foreground hover:bg-primary/15 hover:text-primary"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                <circle cx="8" cy="6" r="2.8" />
                <path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
              </svg>
              Mon profil
            </Link>
          </div>
        </div>
      </header>

      <div id="mobile-menu">
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} locale={locale} />
      </div>
    </>
  );
}

function NavTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  if (active) {
    return (
      <Link
        href={href}
        aria-current="page"
        style={{ color: "#fff" }}
        className="relative top-px inline-flex items-center gap-2 self-stretch rounded-t-lg bg-foreground px-4 py-3 text-[13.5px] font-semibold transition hover:bg-[#00253a]"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="relative top-px inline-flex items-center gap-2 self-stretch rounded-t-lg px-4 py-3 text-[13.5px] font-medium text-foreground transition hover:bg-background hover:text-primary"
    >
      {children}
    </Link>
  );
}
