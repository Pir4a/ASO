import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Mon compte</h1>
        <p className="text-sm text-slate-600">
          Accès aux paramètres, commandes et données personnelles (RGPD).
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/orders" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-slate-900">Mes commandes</p>
          <p className="text-sm text-slate-600">Historique et factures.</p>
        </Link>
        <Link href="/settings" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-slate-900">Paramètres</p>
          <p className="text-sm text-slate-600">Langue, sécurité, consentement.</p>
        </Link>
      </div>
    </div>
  );
}

