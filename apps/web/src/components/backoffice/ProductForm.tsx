"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  categories: Category[];
}

export function ProductForm({ categories }: ProductFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateSlug = (productName: string) => {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères non alphanumériques sauf espaces et tirets
      .trim()
      .replace(/\s+/g, "-") // Remplace les espaces par des tirets
      .replace(/-+/g, "-"); // Remplace les tirets multiples par un seul
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName)); // Génère automatiquement le slug
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: Ajouter l'en-tête Authorization avec le token JWT une fois que AuthGuard est implémenté sur le backend
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
          categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'ajout du produit.");
      }

      setSuccess("Produit ajouté avec succès !");
      // Optionnellement, vider le formulaire ou rediriger
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId("");
      router.refresh(); // Rafraîchir la page actuelle pour mettre à jour la liste des produits si affichée
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Ajouter un nouveau matériel</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nom du produit</label>
          <input
            type="text"
            id="name"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
            value={name}
            onChange={handleNameChange}
            required
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug (URL)</label>
          <input
            type="text"
            id="slug"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700">Prix</label>
            <input type="number" id="price" step="0.01" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-slate-700">Stock</label>
            <input type="number" id="stock" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none" value={stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">Catégorie</label>
          <select id="category" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Ajout en cours..." : "Ajouter le matériel"}
        </button>
      </form>
    </div>
  );
}