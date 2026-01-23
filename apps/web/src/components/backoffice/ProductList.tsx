"use client";

import { useState } from "react";
import type { Product } from "@bootstrap/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ProductListProps {
  token: string | null;
  products: Product[];
  onDelete: (id: string) => void;
  onBulkUpdate: (ids: string[], payload: { price?: number; stock?: number; status?: Product["status"] }) => void;
}

export function ProductList({ token, products, onDelete, onBulkUpdate }: ProductListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [bulkStock, setBulkStock] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<Product["status"] | "">("");

  function toggleSelect(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(product => product.id));
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) onDelete(id);
  }

  async function handleBulkUpdate() {
    if (!token || selectedIds.length === 0) return;
    const payload: { price?: number; stock?: number; status?: Product["status"] } = {};
    if (bulkPrice) payload.price = Number(bulkPrice);
    if (bulkStock) payload.stock = Number(bulkStock);
    if (bulkStatus) payload.status = bulkStatus;

    const res = await fetch(`${API_URL}/admin/products/bulk-update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: selectedIds, payload }),
    });

    if (res.ok) {
      onBulkUpdate(selectedIds, payload);
      setSelectedIds([]);
    }
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Produits</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            placeholder="Prix"
            value={bulkPrice}
            onChange={(event) => setBulkPrice(event.target.value)}
            className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          />
          <input
            type="number"
            placeholder="Stock"
            value={bulkStock}
            onChange={(event) => setBulkStock(event.target.value)}
            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          />
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as Product["status"])}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value="">Statut</option>
            <option value="new">Nouveau</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock faible</option>
            <option value="out_of_stock">Rupture</option>
          </select>
          <button
            type="button"
            onClick={handleBulkUpdate}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
          >
            Appliquer
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={selectedIds.length === products.length && products.length > 0}
          onChange={toggleSelectAll}
        />
        Tout selectionner
      </label>

      <div className="space-y-3">
        {products.map(product => (
          <div key={product.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
            <input
              type="checkbox"
              checked={selectedIds.includes(product.id)}
              onChange={() => toggleSelect(product.id)}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {product.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  #{product.displayOrder ?? 0}
                </span>
              </div>
              <p className="text-xs text-slate-500">SKU {product.sku}</p>
            </div>
            <div className="text-xs text-slate-600">Stock: {product.stock ?? 0}</div>
            <button
              type="button"
              onClick={() => handleDelete(product.id)}
              className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-400"
            >
              Supprimer
            </button>
          </div>
        ))}
        {products.length === 0 && <p className="text-sm text-slate-500">Aucun produit.</p>}
      </div>
    </div>
  );
}
