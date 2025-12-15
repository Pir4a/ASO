export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-600">
          Préférences de langue, alertes stock, consentement cookies.
        </p>
      </div>
      <form className="card space-y-3 p-6">
        <label className="flex items-center justify-between text-sm text-slate-700">
          <span>Notifications stock faible</span>
          <input type="checkbox" defaultChecked className="h-4 w-4" />
        </label>
        <label className="flex items-center justify-between text-sm text-slate-700">
          <span>Recevoir les mises à jour produits</span>
          <input type="checkbox" className="h-4 w-4" />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
          Enregistrer (mock)
        </button>
      </form>
    </div>
  );
}

