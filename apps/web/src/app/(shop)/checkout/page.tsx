export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-600">
          Étapes : adresse ➜ paiement ➜ confirmation. Les données seront transmises à l&apos;API
          NestJS (sécurisée, CSRF/XSS mitigés).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "1. Adresse", detail: "Collecte des infos client, validation RGPD." },
          { title: "2. Paiement", detail: "Passerelle pluggable (mock par défaut)." },
          { title: "3. Confirmation", detail: "Résumé, stockage commande dans PostgreSQL." },
        ].map((step) => (
          <div key={step.title} className="card space-y-2 p-4">
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="text-sm text-slate-600">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-3">
        <p className="text-sm font-semibold text-slate-900">Mock form (à brancher sur l&apos;API)</p>
        <form className="grid gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Email"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          />
          <input
            required
            placeholder="Téléphone"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          />
          <input
            required
            placeholder="Adresse"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none md:col-span-2"
          />
          <button className="mt-2 inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover md:col-span-2">
            Continuer (mock)
          </button>
        </form>
        <p className="text-xs text-slate-500">
          Les validations côté serveur seront gérées par class-validator dans l&apos;API.
        </p>
      </div>
    </div>
  );
}

