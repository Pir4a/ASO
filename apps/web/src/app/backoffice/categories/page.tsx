"use client";

import { useEffect, useState } from "react";
import type { Category } from "@bootstrap/types";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { CategoryForm } from "@/components/backoffice/CategoryForm";
import { CategoryList } from "@/components/backoffice/CategoryList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function BackofficeCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/admin/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  async function handleReorder(nextCategories: Category[]) {
    if (!token) return;
    const payload = nextCategories.map((category, index) => ({
      id: category.id,
      displayOrder: index + 1,
    }));

    const res = await fetch(`${API_URL}/admin/categories/reorder`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: payload }),
    });

    if (res.ok) {
      setCategories(
        nextCategories.map((category, index) => ({
          ...category,
          displayOrder: index + 1,
          order: index + 1,
        }))
      );
    }
  }

  function handleCreated(category: Category) {
    setCategories(prev => [category, ...prev]);
  }

  function handleUpdated(category: Category) {
    setCategories(prev => prev.map(item => (item.id === category.id ? category : item)));
  }

  function handleDeleted(id: string) {
    setCategories(prev => prev.filter(item => item.id !== id));
  }

  function handleBulkUpdate(ids: string[], isActive: boolean) {
    setCategories(prev =>
      prev.map(item => (ids.includes(item.id) ? { ...item, isActive } : item))
    );
  }

  function handleBulkDelete(ids: string[]) {
    setCategories(prev => prev.filter(item => !ids.includes(item.id)));
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Categories (backoffice)</h1>
          <p className="text-sm text-slate-600">
            Creez, reordonnez et activez vos categories. Le glisser-deposer met a jour
            l&apos;ordre d&apos;affichage.
          </p>
        </div>

        <CategoryForm token={token} onCreated={handleCreated} />

        {loading ? (
          <div className="card p-6 text-sm text-slate-500">Chargement...</div>
        ) : (
          <CategoryList
            token={token}
            categories={categories}
            onUpdate={handleUpdated}
            onDelete={handleDeleted}
            onReorder={handleReorder}
            onBulkUpdate={handleBulkUpdate}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>
    </AuthGuard>
  );
}
