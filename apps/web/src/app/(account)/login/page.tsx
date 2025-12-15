import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-600">Authentification via l&apos;API NestJS.</p>
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
          Se connecter (mock)
        </button>
        <Link href="/signup" className="text-center text-sm text-primary">
          Créer un compte
        </Link>
      </form>
    </div>
  );
}

