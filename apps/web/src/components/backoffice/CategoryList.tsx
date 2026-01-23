"use client";

import { useMemo, useState } from "react";
import type { Category } from "@bootstrap/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface CategoryListProps {
  token: string | null;
  categories: Category[];
  onUpdate: (category: Category) => void;
  onDelete: (id: string) => void;
  onReorder: (items: Category[]) => void;
  onBulkUpdate: (ids: string[], isActive: boolean) => void;
  onBulkDelete: (ids: string[]) => void;
}

export function CategoryList({
  token,
  categories,
  onUpdate,
  onDelete,
  onReorder,
  onBulkUpdate,
  onBulkDelete,
}: CategoryListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = useMemo(
    () => categories.length > 0 && selectedIds.length === categories.length,
    [categories.length, selectedIds.length]
  );

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : categories.map(cat => cat.id));
  }

  async function handleStatus(id: string, isActive: boolean) {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/categories/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) onDelete(id);
  }

  async function handleBulkStatus(isActive: boolean) {
    if (!token || selectedIds.length === 0) return;
    const res = await fetch(`${API_URL}/admin/categories/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: selectedIds, isActive }),
    });
    if (res.ok) {
      onBulkUpdate(selectedIds, isActive);
      setSelectedIds([]);
    }
  }

  async function handleBulkDelete() {
    if (!token || selectedIds.length === 0) return;
    const res = await fetch(`${API_URL}/admin/categories`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setDragIndex(null);
    onReorder(reordered);
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleBulkStatus(true)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
          >
            Activer selection
          </button>
          <button
            type="button"
            onClick={() => handleBulkStatus(false)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
          >
            Desactiver selection
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-400"
          >
            Supprimer selection
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Tout selectionner
        </label>
        {categories.map((category, index) => {
          const isActive = category.isActive ?? true;
          return (
          <div
            key={category.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(category.id)}
              onChange={() => toggleSelect(category.id)}
            />
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {category.slug}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  #{category.displayOrder ?? category.order ?? 0}
                </span>
                {!isActive && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-slate-500">{category.description}</p>
              )}
            </div>
            {category.imageUrl && (
              <img
                src={category.imageUrl.startsWith("http") ? category.imageUrl : `${API_URL}${category.imageUrl}`}
                alt={category.name}
                className="h-12 w-12 rounded-md object-cover"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatus(category.id, !isActive)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
              >
                {isActive ? "Desactiver" : "Activer"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-400"
              >
                Supprimer
              </button>
            </div>
          </div>
        );
        })}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">Aucune categorie pour le moment.</p>
        )}
      </div>
    </div>
  );
}
