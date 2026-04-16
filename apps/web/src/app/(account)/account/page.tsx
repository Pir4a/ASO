import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Mon compte</h1>
        <p className="text-sm text-foreground/70">
          Accès aux paramètres, commandes et données personnelles (RGPD).
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/orders" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-foreground">Mes commandes</p>
          <p className="text-sm text-foreground/70">Historique et factures.</p>
        </Link>
        <Link href="/settings" className="card p-4 hover:border-primary">
          <p className="text-sm font-semibold text-foreground">Paramètres</p>
          <p className="text-sm text-foreground/70">Langue, sécurité, consentement.</p>
        </Link>
      </div>
    </div>
  );
}

