export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Contact & Chatbot</h1>
        <p className="text-sm text-foreground/70">
          Formulaire de contact et chatbot (intégration API à venir).
        </p>
      </div>
      <form className="card space-y-3 p-6">
        <input
          required
          className="w-full rounded-md border border-primary/25 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          placeholder="Nom"
        />
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-primary/25 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
        />
        <textarea
          required
          className="w-full rounded-md border border-primary/25 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          placeholder="Votre demande"
          rows={4}
        />
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
          Envoyer (mock)
        </button>
      </form>
      <div className="card p-4">
        <p className="text-sm text-foreground/70">
          Le chatbot sera connecté à l&apos;API outils côté backoffice (canal support).
        </p>
      </div>
    </div>
  );
}

