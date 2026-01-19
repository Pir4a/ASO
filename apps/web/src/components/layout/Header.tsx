"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n.shared";

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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
            AS
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Althea Systems</p>
            <p className="text-xs text-foreground/70">Matériel médical de pointe</p>
          </div>
        </div>
        {/* La navigation principale est retirée pour simplifier le header comme demandé */}
        {/* Si tu souhaites la remettre, il faudra la réintégrer ici */}

        <div className="flex items-center gap-3">
          {/* Liens de navigation basiques pour l'exemple */}
          <Link href="/categories" className="text-sm font-medium text-slate-700 hover:text-primary">
            Catégories
          </Link>
          <Link href="/products" className="text-sm font-medium text-slate-700 hover:text-primary">
            Produits
          </Link>
          <Link href="/search" className="text-sm font-medium text-slate-700 hover:text-primary">
            Recherche
          </Link>
          <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-primary">
            Contact
          </Link>

          <Link
            href="/cart"
            className="relative rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:border-primary hover:text-primary transition-colors"
          >
            Panier
            <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-primary" />
          </Link>
          <LocaleSwitcher value={locale} />
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-700">Bonjour, {user?.email}</span>
              <Link href="/profile" className="rounded-md bg-blue-500 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-blue-600">
                Mon Profil
              </Link>
              {user?.role === "admin" && (
                <Link href="/backoffice" className="rounded-md bg-purple-500 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-purple-600">
                  Backoffice
                </Link>)}
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-500 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-primary">
                Connexion
              </Link>
              <Link href="/signup" className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
