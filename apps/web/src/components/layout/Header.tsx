import Link from "next/link";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Locale } from "@/lib/i18n.shared";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/categories", label: "Catégories" },
  { href: "/search", label: "Recherche" },
  { href: "/contact", label: "Contact" },
  { href: "/chatbot", label: "Chatbot" },
];

export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
            AS
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Althea Systems</p>
            <p className="text-xs text-slate-500">Matériel médical de pointe</p>
          </div>
        </div>
        <nav className="hidden items-center gap-4 text-sm font-medium text-slate-700 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:border-primary hover:text-primary"
          >
            Panier
            <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-primary" />
          </Link>
          <LocaleSwitcher value={locale} />
          <Link
            href="/account"
            className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 md:inline-flex"
          >
            Mon compte
          </Link>
        </div>
      </div>
    </header>
  );
}

