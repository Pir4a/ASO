"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { ProductForm } from "@/components/backoffice/ProductForm";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
};
type Product = { id: string };
type AdminUser = {
  id: string;
  email: string;
  role: "customer" | "admin";
  status: "active" | "inactive" | "pending";
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function BackofficePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const loadUsers = async (q?: string) => {
    setLoadingUsers(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`${API_URL}/users?${params.toString()}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs.");
      setUsers(await res.json());
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories?includeInactive=true`, { headers: authHeaders });
      if (!res.ok) throw new Error("Impossible de charger les catégories.");
      const data = await res.json();
      setCategories(data);
    } catch {
      setFeedback("Chargement des catégories impossible.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/categories?includeInactive=true`, { headers: authHeaders }),
          fetch(`${API_URL}/products`),
        ]);
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
      } catch {
        // Soft fail on dashboard cards.
      }
      await Promise.all([loadUsers(), loadCategories()]);
    };
    load();
  }, []);

  const runAction = async (userId: string, action: "activate" | "deactivate" | "delete" | "promote" | "demote" | "reset") => {
    setFeedback(null);
    try {
      if (action === "activate" || action === "deactivate") {
        await fetch(`${API_URL}/users/${userId}/status`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status: action === "activate" ? "active" : "inactive" }),
        });
      } else if (action === "delete") {
        await fetch(`${API_URL}/users/${userId}`, { method: "DELETE", headers: authHeaders });
      } else if (action === "promote" || action === "demote") {
        await fetch(`${API_URL}/users/${userId}/role`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ role: action === "promote" ? "admin" : "customer" }),
        });
      } else {
        await fetch(`${API_URL}/users/${userId}/reset-password`, {
          method: "POST",
          headers: authHeaders,
        });
      }
      await loadUsers(search);
      setFeedback("Action admin exécutée.");
    } catch {
      setFeedback("Action admin échouée.");
    }
  };

  const createCategory = async () => {
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...newCategory, order: categories.length }),
      });
      if (!res.ok) throw new Error("Création de catégorie impossible.");
      setNewCategory({ name: "", slug: "", description: "" });
      await loadCategories();
      setFeedback("Catégorie créée.");
    } catch {
      setFeedback("Erreur création catégorie.");
    }
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    await fetch(`${API_URL}/categories/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(patch),
    });
    await loadCategories();
  };

  const moveCategory = async (id: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;
    await fetch(`${API_URL}/categories/reorder/list`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        items: sorted.map((c, i) => ({ id: c.id, order: i })),
      }),
    });
    await loadCategories();
  };

  const bulkCategoryAction = async (action: "activate" | "deactivate" | "delete") => {
    if (!selectedCategoryIds.length) return;
    await fetch(`${API_URL}/categories/bulk`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ ids: selectedCategoryIds, action }),
    });
    setSelectedCategoryIds([]);
    await loadCategories();
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Backoffice (MVP)</h1>
        <p className="text-sm text-slate-600">
          Gestion des contenus : carrousel, catégories, produits. API NestJS sécurisée.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-900">Produits</p>
          <p className="text-2xl font-semibold text-primary">{products.length}</p>
          <Link href="/products" className="text-sm text-primary">
            Voir la liste
          </Link>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-900">Catégories</p>
          <p className="text-2xl font-semibold text-primary">{categories.length}</p>
          <Link href="/categories" className="text-sm text-primary">
            Gérer les catégories
          </Link>
        </div>
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-900">Contenus</p>
          <p className="text-2xl font-semibold text-primary">Carrousel</p>
          <Link href="/contact" className="text-sm text-primary">
            Support / chatbot
          </Link>
        </div>
      </div>

        {/* Nouvelle section pour l'ajout de matériel */}
        <ProductForm categories={categories} />

      <div className="card p-6 space-y-3">
        <p className="text-sm font-semibold text-slate-900">Actions rapides</p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
            Import produits (CSV)
          </button>
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
            Mise à jour carrousel
          </button>
          <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
            Publier texte homepage
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Ces actions appelleront les endpoints NestJS protégés (auth admin requise).
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Catégories (Backoffice)</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={newCategory.name}
            onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nom"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newCategory.slug}
            onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
            placeholder="Slug"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newCategory.description}
            onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button onClick={createCategory} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white">
          Créer la catégorie
        </button>
        <div className="flex gap-2">
          <button onClick={() => bulkCategoryAction("activate")} className="rounded border px-2 py-1 text-xs">Bulk activer</button>
          <button onClick={() => bulkCategoryAction("deactivate")} className="rounded border px-2 py-1 text-xs">Bulk désactiver</button>
          <button onClick={() => bulkCategoryAction("delete")} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600">Bulk supprimer</button>
        </div>
        <div className="space-y-2">
          {[...categories]
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <div key={cat.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-900">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={(e) =>
                        setSelectedCategoryIds((prev) =>
                          e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                        )
                      }
                    />
                    {cat.name} ({cat.slug}) - {cat.isActive ? "active" : "inactive"} - ordre {cat.order}
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => moveCategory(cat.id, "up")} className="rounded border px-2 py-1 text-xs">↑</button>
                    <button onClick={() => moveCategory(cat.id, "down")} className="rounded border px-2 py-1 text-xs">↓</button>
                    <button onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })} className="rounded border px-2 py-1 text-xs">
                      {cat.isActive ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => updateCategory(cat.id, { name: `${cat.name} (edit)` })} className="rounded border px-2 py-1 text-xs">
                      Edit rapide
                    </button>
                    <button onClick={() => fetch(`${API_URL}/categories/${cat.id}`, { method: "DELETE", headers: authHeaders }).then(loadCategories)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Utilisateurs</h2>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => loadUsers(search)}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
            >
              Rechercher
            </button>
          </div>
        </div>
        {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
        {loadingUsers ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {u.email} - {u.role} - {u.status}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => runAction(u.id, u.isActive ? "deactivate" : "activate")} className="rounded border px-2 py-1 text-xs">
                      {u.isActive ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => runAction(u.id, u.role === "admin" ? "demote" : "promote")} className="rounded border px-2 py-1 text-xs">
                      {u.role === "admin" ? "Retirer admin" : "Promouvoir admin"}
                    </button>
                    <button onClick={() => runAction(u.id, "reset")} className="rounded border px-2 py-1 text-xs">
                      Reset mdp
                    </button>
                    <button onClick={() => runAction(u.id, "delete")} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </AuthGuard>
  );
}
