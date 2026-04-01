"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { ProductForm } from "@/components/backoffice/ProductForm";

type Category = { id: string; name: string; slug: string };
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

  useEffect(() => {
    const load = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products`),
        ]);
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());
      } catch {
        // Soft fail on dashboard cards.
      }
      await loadUsers();
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
