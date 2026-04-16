export default function MentionsPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Mentions légales</h1>
        <p className="text-sm text-foreground/70">Informations société et hébergeur.</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-foreground/70">
          Placeholder. Les données seront injectées depuis le backoffice (API contenue dans NestJS).
        </p>
      </div>
    </div>
  );
}

