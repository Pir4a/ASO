export default function ChatbotPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Chatbot support</h1>
        <p className="text-sm text-slate-600">
          Espace dédié au chatbot (FAQ, redirection vers contact humain).
        </p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-slate-600">
          L&apos;UI chatbot sera connectée via WebSocket/REST NestJS. Prévu pour gérer le multilingue
          et le contexte commande.
        </p>
      </div>
    </div>
  );
}

