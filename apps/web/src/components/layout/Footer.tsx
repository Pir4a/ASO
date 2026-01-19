import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-foreground text-slate-100 mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-300">
          © {new Date().getFullYear()} Althea Systems. Tous droits réservés.
        </p>
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
          <Link href="/legal/cgu" className="hover:text-primary-hover transition-colors">
            CGU
          </Link>
          <Link href="/legal/mentions" className="hover:text-primary-hover transition-colors">
            Mentions légales
          </Link>
          <Link href="/contact" className="hover:text-primary-hover transition-colors">
            Contact
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-slate-100">Support réactif</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

