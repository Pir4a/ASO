import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-foreground text-slate-200 mt-20 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                AS
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Althea Systems</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Partenaire de confiance pour l'équipement médical de haute précision. Innovation et fiabilité au service de la santé.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">À Propos</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">Notre histoire</Link></li>
              <li><Link href="/careers" className="text-sm text-slate-400 hover:text-white transition-colors">Carrières</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Actualités</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contactez-nous</Link></li>
              <li><Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-sm text-slate-400 hover:text-white transition-colors">Livraison</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">Restez informé</h3>
            <p className="text-sm text-slate-400 mb-4">Recevez nos dernières offres et actualités.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full rounded-md bg-slate-800 border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm">Go</Button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Althea Systems. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link href="/legal/cgu" className="text-sm text-slate-500 hover:text-white transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

