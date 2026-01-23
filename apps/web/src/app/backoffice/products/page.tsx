"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Product } from "@bootstrap/types";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { ProductForm } from "@/components/backoffice/ProductForm";
import { ProductList } from "@/components/backoffice/ProductList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function BackofficeProductsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [availability, setAvailability] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("category", categoryId);
    if (status) params.set("status", status);
    if (availability) params.set("availability", availability);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return params.toString();
  }, [search, categoryId, status, availability, sortBy, sortOrder]);

  useEffect(() => {
    async function loadInitial() {
      if (!token) return;
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/admin/categories`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/admin/products?${queryString}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (productsRes.ok) {
          const result = await productsRes.json();
          const items = result.items || result;
          setProducts(items.map(normalizeProduct));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [token, queryString]);

  function handleCreated(product: Product) {
    setProducts(prev => [normalizeProduct(product), ...prev]);
  }

  function handleDelete(id: string) {
    setProducts(prev => prev.filter(item => item.id !== id));
  }

  function handleBulkUpdate(ids: string[], payload: { price?: number; stock?: number; status?: Product["status"] }) {
    const normalizedPayload = payload.price !== undefined
      ? { ...payload, priceCents: Math.round(Number(payload.price) * 100) }
      : payload;
    setProducts(prev =>
      prev.map(item => (ids.includes(item.id) ? { ...item, ...normalizedPayload } : item))
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Produits (backoffice)</h1>
          <p className="text-sm text-slate-600">
            Filtrez, mettez a jour et gerez les stocks. Les actions en masse s&apos;appliquent aux
            produits selectionnes.
          </p>
        </div>

        <div className="card grid gap-3 p-6 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Recherche nom/SKU"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="">Toutes les categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock faible</option>
            <option value="out_of_stock">Rupture</option>
          </select>
          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="">Disponibilite</option>
            <option value="in_stock">Disponible</option>
            <option value="out_of_stock">Indisponible</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="createdAt">Date</option>
            <option value="price">Prix</option>
            <option value="displayOrder">Priorite</option>
          </select>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="desc">Descendant</option>
            <option value="asc">Ascendant</option>
          </select>
        </div>

        <ProductForm token={token} categories={categories} products={products} onCreated={handleCreated} />

        {loading ? (
          <div className="card p-6 text-sm text-slate-500">Chargement...</div>
        ) : (
          <ProductList
            token={token}
            products={products}
            onDelete={handleDelete}
            onBulkUpdate={handleBulkUpdate}
          />
        )}
      </div>
    </AuthGuard>
  );
}

function normalizeProduct(product: any): Product {
  if (product.priceCents !== undefined) return product;
  if (product.price !== undefined) {
    return {
      ...product,
      priceCents: Math.round(Number(product.price) * 100),
    };
  }
  return product;
}
