"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'inactive';
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active' as 'active' | 'inactive',
    order: 0,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    loadFAQs(storedToken);
  }, []);

  const loadFAQs = async (authToken: string | null) => {
    if (!authToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/faq?includeInactive=true`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error("Error loading FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const url = editingFaq
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/faq/${editingFaq.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/faq`;

      const method = editingFaq ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadFAQs(token);
        setShowForm(false);
        setEditingFaq(null);
        setFormData({ question: '', answer: '', status: 'active', order: 0 });
        alert(editingFaq ? "FAQ mise à jour !" : "FAQ créée !");
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      order: faq.order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/faq/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await loadFAQs(token);
        alert("FAQ supprimée !");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const toggleStatus = async (faq: FAQ) => {
    if (!token) return;

    const newStatus = faq.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/faq/${faq.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadFAQs(token);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Gestion des FAQ</h1>
            <p className="text-slate-600 mt-1">Questions fréquemment posées pour le chatbot</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Nouvelle FAQ
          </button>
        </div>

        {/* FAQ Form */}
        {showForm && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingFaq ? "Modifier la FAQ" : "Nouvelle FAQ"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingFaq(null);
                  setFormData({ question: '', answer: '', status: 'active', order: 0 });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Quelle est votre question ?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Réponse *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Réponse détaillée..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingFaq(null);
                    setFormData({ question: '', answer: '', status: 'active', order: 0 });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  {editingFaq ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQ List */}
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Liste des FAQ</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-900">{faq.question}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        faq.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {faq.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Ordre: {faq.order}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {faq.answer}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Vues: {faq.viewCount}</span>
                      <span>Utiles: {faq.helpfulCount}</span>
                      <span>Créé: {new Date(faq.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(faq)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        faq.status === 'active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {faq.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>

                    <button
                      onClick={() => handleEdit(faq)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {faqs.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Aucune FAQ créée. Cliquez sur "Nouvelle FAQ" pour commencer.
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}