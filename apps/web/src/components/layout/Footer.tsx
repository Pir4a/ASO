import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()} Althea Systems. Tous droits réservés.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <Link href="/legal/cgu" className="hover:text-primary">
            CGU
          </Link>
          <Link href="/legal/mentions" className="hover:text-primary">
            Mentions légales
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>Support réactif</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

