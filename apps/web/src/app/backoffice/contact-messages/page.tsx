"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    loadMessages(storedToken);
  }, []);

  const loadMessages = async (authToken: string | null) => {
    if (!authToken) return;

    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-messages?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-messages/${messageId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await loadMessages(token);
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, status: status as any } : null);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const sendReply = async () => {
    if (!token || !selectedMessage || !replyText.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-messages/${selectedMessage.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
      });

      if (res.ok) {
        await loadMessages(token);
        setReplyText("");
        setSelectedMessage(null);
        alert("Réponse envoyée avec succès !");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Erreur lors de l'envoi de la réponse");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: "bg-red-100 text-red-800",
      read: "bg-blue-100 text-blue-800",
      replied: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  const filteredMessages = messages.filter(msg => {
    if (filter.status !== 'all' && msg.status !== filter.status) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return msg.name.toLowerCase().includes(search) ||
             msg.email.toLowerCase().includes(search) ||
             msg.subject?.toLowerCase().includes(search) ||
             msg.message.toLowerCase().includes(search);
    }
    return true;
  });

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Chargement...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages de Contact</h1>
            <p className="text-slate-600 mt-1">Gérez les messages reçus via le formulaire de contact</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous</option>
                <option value="new">Nouveaux</option>
                <option value="read">Lus</option>
                <option value="replied">Répondus</option>
                <option value="archived">Archivés</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rechercher</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Nom, email, sujet..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Messages</h3>
              </div>
              <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 ${
                      selectedMessage?.id === message.id ? 'bg-slate-50 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {message.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {message.email}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(message.status)}`}>
                        {message.status === 'new' ? 'Nouveau' :
                         message.status === 'read' ? 'Lu' :
                         message.status === 'replied' ? 'Répondu' : 'Archivé'}
                      </span>
                    </div>
                    {message.subject && (
                      <p className="text-sm text-slate-700 mb-1 truncate">
                        {message.subject}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 truncate">
                      {message.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    Aucun message trouvé
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="card">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Détails du message</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMessage.status}
                        onChange={(e) => updateMessageStatus(selectedMessage.id, e.target.value)}
                        className="text-sm border border-slate-300 rounded px-2 py-1"
                      >
                        <option value="new">Nouveau</option>
                        <option value="read">Lu</option>
                        <option value="replied">Répondu</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">De</label>
                      <p className="text-sm text-slate-900">{selectedMessage.name}</p>
                      <p className="text-sm text-slate-500">{selectedMessage.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Sujet</label>
                      <p className="text-sm text-slate-900">{selectedMessage.subject || 'Sans sujet'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <div className="bg-slate-50 rounded-md p-4">
                      <p className="text-sm text-slate-900 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>

                  {selectedMessage.adminReply && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Votre réponse</label>
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <p className="text-sm text-green-900 whitespace-pre-wrap">
                          {selectedMessage.adminReply}
                        </p>
                        {selectedMessage.repliedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Répondu le {new Date(selectedMessage.repliedAt).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedMessage.adminReply && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Répondre</label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tapez votre réponse..."
                        rows={6}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={sendReply}
                          disabled={!replyText.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                          Envoyer la réponse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center h-96">
                <p className="text-slate-500">Sélectionnez un message pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}