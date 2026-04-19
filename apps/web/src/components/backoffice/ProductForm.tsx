"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  categories: Category[];
  onCreated?: () => void;
}

export function ProductForm({ categories, onCreated }: ProductFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [listPriority, setListPriority] = useState("");
  const [galleryUrlsText, setGalleryUrlsText] = useState("");
  const [specsJson, setSpecsJson] = useState("");
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateSlug = (productName: string) =>
    productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setName(next);
    setSlug(generateSlug(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let specs: Record<string, string> | undefined;
      if (specsJson.trim()) {
        try {
          const parsed = JSON.parse(specsJson) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            specs = Object.fromEntries(
              Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
            );
          } else {
            throw new Error("Le JSON des specs doit être un objet { \"clé\": \"valeur\" }.");
          }
        } catch {
          throw new Error("Specs invalides : JSON objet attendu (ex. {\"Puissance\":\"400W\"}).");
        }
      }

      const galleryUrls = galleryUrlsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
          categoryId,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          listPriority: listPriority.trim() === "" ? undefined : Math.max(0, parseInt(listPriority, 10) || 0),
          galleryUrls: galleryUrls.length ? galleryUrls : undefined,
          specs,
          featured,
          featuredOrder: 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erreur lors de l'ajout du produit.");

      setSuccess("Produit ajouté avec succès !");
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId("");
      setThumbnailUrl("");
      setListPriority("");
      setGalleryUrlsText("");
      setSpecsJson("");
      setFeatured(false);
      onCreated?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15";
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Nom du produit</label>
          <input id="name" type="text" className={inputCls} value={name} onChange={handleNameChange} required />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>Slug (URL)</label>
          <input id="slug" type="text" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea id="description" rows={3} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="price" className={labelCls}>Prix (€)</label>
          <input id="price" type="number" step="0.01" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="stock" className={labelCls}>Stock</label>
          <input id="stock" type="number" className={inputCls} value={stock} onChange={(e) => setStock(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="category" className={labelCls}>Catégorie</label>
          <select id="category" className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Sélectionner</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="thumbnailUrl" className={labelCls}>URL miniature</label>
          <input
            id="thumbnailUrl"
            type="url"
            className={inputCls}
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label htmlFor="listPriority" className={labelCls}>Priorité liste catégorie (0–9999)</label>
          <input
            id="listPriority"
            type="number"
            min={0}
            className={inputCls}
            value={listPriority}
            onChange={(e) => setListPriority(e.target.value)}
            placeholder="0 = défaut, plus haut = affiché avant"
          />
        </div>
      </div>

      <div>
        <label htmlFor="galleryUrls" className={labelCls}>Galerie — une URL par ligne (optionnel)</label>
        <textarea
          id="galleryUrls"
          rows={3}
          className={inputCls}
          value={galleryUrlsText}
          onChange={(e) => setGalleryUrlsText(e.target.value)}
          placeholder={"https://…\nhttps://…"}
        />
      </div>

      <div>
        <label htmlFor="specsJson" className={labelCls}>Specs techniques (JSON objet)</label>
        <textarea
          id="specsJson"
          rows={4}
          className={`${inputCls} font-mono text-xs`}
          value={specsJson}
          onChange={(e) => setSpecsJson(e.target.value)}
          placeholder='{"Puissance":"400W","Norme":"CE"}'
        />
      </div>

      <div className="flex items-end">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#00a8b5] focus:ring-[#00a8b5]"
          />
          Mettre en vedette (sélection homepage)
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00a8b5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#33bfc9] disabled:opacity-50"
        >
          {loading ? "Ajout…" : "Ajouter le produit"}
        </button>
      </div>
    </form>
  );
}
