"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";

interface ChatConversation {
  id: string;
  sessionId?: string;
  userId?: string;
  message: string;
  type: 'user' | 'bot' | 'system';
  status: 'active' | 'escalated' | 'closed';
  escalatedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotAdminPage() {
  const [activeConversations, setActiveConversations] = useState<ChatConversation[]>([]);
  const [escalatedConversations, setEscalatedConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    loadConversations(storedToken);
  }, []);

  const loadConversations = async (authToken: string | null) => {
    if (!authToken) return;

    try {
      const [activeRes, escalatedRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/chatbot/conversations/active`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/chatbot/conversations/escalated`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveConversations(activeData);
      }

      if (escalatedRes.ok) {
        const escalatedData = await escalatedRes.json();
        setEscalatedConversations(escalatedData);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/chatbot/conversations/${conversationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await loadConversations(token);
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const assignToSelf = async (conversationId: string) => {
    if (!token) return;

    // For now, just mark as closed. In a real implementation, you'd get the current user ID
    await updateConversationStatus(conversationId, 'closed');
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Gestion du Chatbot</h1>
            <p className="text-slate-600 mt-1">Supervisez les conversations et gérez les escalades</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Conversations */}
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Conversations Actives
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {activeConversations.length}
                </span>
              </h2>
            </div>

            <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
              {activeConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {conversation.userId ? 'Utilisateur connecté' : 'Visiteur anonyme'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {conversation.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(conversation.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
              {activeConversations.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Aucune conversation active
                </div>
              )}
            </div>
          </div>

          {/* Escalated Conversations */}
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Conversations Escaladées
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {escalatedConversations.length}
                </span>
              </h2>
            </div>

            <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
              {escalatedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {conversation.userId ? 'Utilisateur connecté' : 'Visiteur anonyme'}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      Escaladé
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {conversation.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(conversation.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
              {escalatedConversations.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Aucune conversation escaladée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Details */}
        {selectedConversation && (
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Détails de la Conversation
                </h2>
                <div className="flex gap-2">
                  {selectedConversation.status === 'escalated' && (
                    <button
                      onClick={() => assignToSelf(selectedConversation.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    >
                      Prendre en charge
                    </button>
                  )}
                  <button
                    onClick={() => updateConversationStatus(selectedConversation.id, 'closed')}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Type:</span>
                    <span className="ml-2 text-slate-600">
                      {selectedConversation.userId ? 'Utilisateur connecté' : 'Visiteur anonyme'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Statut:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedConversation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      selectedConversation.status === 'escalated' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedConversation.status === 'active' ? 'Active' :
                       selectedConversation.status === 'escalated' ? 'Escaladée' : 'Fermée'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Session ID:</span>
                    <span className="ml-2 text-slate-600 font-mono text-xs">
                      {selectedConversation.sessionId || selectedConversation.userId}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Dernière activité:</span>
                    <span className="ml-2 text-slate-600">
                      {new Date(selectedConversation.updatedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-700">Dernier message:</span>
                  <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-900">{selectedConversation.message}</p>
                  </div>
                </div>

                {selectedConversation.status === 'escalated' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Conversation escaladée
                        </p>
                        <p className="mt-1 text-sm text-yellow-700">
                          L'utilisateur a demandé à parler à un humain. Un conseiller devrait prendre en charge cette conversation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}