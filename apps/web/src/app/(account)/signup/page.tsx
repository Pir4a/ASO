import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Inscription</h1>
        <p className="text-sm text-slate-600">
          Création de compte : validation côté API, vérification email optionnelle.
        </p>
      </div>
      <form className="card space-y-3 p-6">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
          Créer le compte (mock)
        </button>
        <Link href="/login" className="text-center text-sm text-primary">
          Déjà inscrit ? Se connecter
        </Link>
      </form>
    </div>
  );
}

