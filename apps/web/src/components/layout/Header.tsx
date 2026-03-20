"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n.shared";
import { ShoppingCart, User, LogOut, Menu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md transition-all duration-200 supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80 dark:border-slate-800/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
              <Activity className="size-6" />
            </div>
            <div className="hidden flex-col md:flex">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground leading-none">
                Althea
              </span>
              <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase leading-none">
                Systems
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            ["Produits", "/products"],
            ["Catégories", "/categories"],
            ["À propos", "/about"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          <LocaleSwitcher value={locale} />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <Button variant="ghost" size="icon-sm" className="relative group text-slate-600 hover:text-primary dark:text-slate-400" asChild>
            <Link href="/cart">
              <ShoppingCart className="size-5 transition-transform group-hover:scale-110" />
              <span className="sr-only">Panier</span>
              {/* Badge placeholder */}
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                2
              </span>
            </Link>
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800/60">
              <Button variant="ghost" size="icon-sm" asChild className="rounded-full">
                <Link href="/profile">
                  <User className="size-5 text-slate-600 dark:text-slate-400" />
                </Link>
              </Button>
              {user?.role === "admin" && (
                <Button variant="outline" size="sm" asChild className="hidden md:flex h-8 text-xs font-medium">
                  <Link href="/backoffice">Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-slate-400 hover:text-destructive hover:bg-destructive/10">
                <LogOut className="size-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-primary md:block dark:text-slate-400">
                Connexion
              </Link>
              <Button size="sm" asChild className="rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-blue-600 text-white font-medium px-5">
                <Link href="/signup">Commencer</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle (Visual only for now) */}
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600 dark:text-slate-400">
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
