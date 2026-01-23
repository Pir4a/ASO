"use client";

import { useState, FormEvent } from "react";
import type { Category, Product } from "@bootstrap/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ProductFormProps {
  token: string | null;
  categories: Category[];
  products: Product[];
  onCreated: (product: Product) => void;
}

export function ProductForm({ token, categories, products, onCreated }: ProductFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [images, setImages] = useState<File[]>([]);
  const [specsText, setSpecsText] = useState("{}");

  const generateSlug = (productName: string) => {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    let specsPayload: Record<string, any> = {};
    try {
      specsPayload = specsText ? JSON.parse(specsText) : {};
    } catch {
      setStatus("error");
      return;
    }

    const imageUrls = String(formData.get("imageUrls") || "")
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      slug: String(formData.get("slug") || "").trim() || undefined,
      description: String(formData.get("description") || "").trim(),
      price: Number(formData.get("price") || 0),
      stock: Number(formData.get("stock") || 0),
      categoryId: String(formData.get("categoryId") || ""),
      status: formData.get("status") as Product["status"],
      displayOrder: Number(formData.get("displayOrder") || 0),
      imageUrls,
      specs: specsPayload,
      relatedProductIds: Array.from(formData.getAll("relatedProductIds")).map(String),
    };

    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la creation du produit.");
      let product: Product = await res.json();

      if (images.length > 0) {
        const upload = new FormData();
        images.forEach(file => upload.append("images", file));
        const uploadRes = await fetch(`${API_URL}/admin/products/${product.id}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: upload,
        });
        if (uploadRes.ok) {
          product = await uploadRes.json();
        }
      }

      onCreated(product);
      setImages([]);
      setSpecsText("{}");
      event.currentTarget.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="card space-y-4 p-6" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-slate-900">Ajouter un produit</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nom du produit"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          onChange={(event) => {
            const slugInput = event.currentTarget.form?.querySelector<HTMLInputElement>('input[name="slug"]');
            if (slugInput && !slugInput.value) {
              slugInput.value = generateSlug(event.target.value);
            }
          }}
        />
        <input
          name="slug"
          placeholder="Slug (auto)"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <textarea
        name="description"
        required
        placeholder="Description"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={4}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="price"
          type="number"
          step="0.01"
          required
          placeholder="Prix"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          name="stock"
          type="number"
          required
          placeholder="Stock"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <select
          name="status"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
          defaultValue="new"
        >
          <option value="new">Nouveau</option>
          <option value="in_stock">En stock</option>
          <option value="low_stock">Stock faible</option>
          <option value="out_of_stock">Rupture</option>
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <select
          name="categoryId"
          required
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        >
          <option value="">Categorie</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          name="displayOrder"
          type="number"
          placeholder="Priorite d'affichage"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <textarea
        name="imageUrls"
        placeholder="URLs images (une par ligne)"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={3}
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(event) => setImages(Array.from(event.target.files || []))}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      />
      <textarea
        value={specsText}
        onChange={(event) => setSpecsText(event.target.value)}
        placeholder='Specifications (JSON), ex: {"puissance":"120W"}'
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={3}
      />
      <label className="text-sm font-medium text-slate-700">Produits similaires</label>
      <select
        name="relatedProductIds"
        multiple
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
      >
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={status === "loading" || !token}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
      >
        {status === "loading" ? "Creation..." : "Creer le produit"}
      </button>
      {status === "success" && <p className="text-sm text-emerald-600">Produit cree.</p>}
      {status === "error" && <p className="text-sm text-rose-600">Erreur lors de la creation.</p>}
    </form>
  );
}