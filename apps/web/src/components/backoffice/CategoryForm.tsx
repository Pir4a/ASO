"use client";

import { useState, FormEvent } from "react";
import type { Category } from "@bootstrap/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface CategoryFormProps {
  token: string | null;
  onCreated: (category: Category) => void;
}

export function CategoryForm({ token, onCreated }: CategoryFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setStatus("loading");
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      slug: String(formData.get("slug") || "").trim() || undefined,
      description: String(formData.get("description") || "").trim() || undefined,
      imageUrl: String(formData.get("imageUrl") || "").trim() || undefined,
      isActive: formData.get("isActive") === "on",
    };

    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create category failed");
      const category: Category = await res.json();

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadRes = await fetch(`${API_URL}/admin/categories/${category.id}/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        });
        if (uploadRes.ok) {
          const updated = await uploadRes.json();
          onCreated(updated);
        } else {
          onCreated(category);
        }
      } else {
        onCreated(category);
      }

      setStatus("success");
      setImageFile(null);
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="card space-y-3 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nom de la categorie"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          name="slug"
          placeholder="Slug (optionnel)"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <textarea
        name="description"
        placeholder="Description"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        rows={3}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="imageUrl"
          placeholder="URL image (optionnel)"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isActive" defaultChecked />
        Activer la categorie
      </label>
      <button
        type="submit"
        disabled={status === "loading" || !token}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"
      >
        {status === "loading" ? "Creation..." : "Creer la categorie"}
      </button>
      {status === "success" && <p className="text-sm text-emerald-600">Categorie creee.</p>}
      {status === "error" && <p className="text-sm text-rose-600">Erreur de creation.</p>}
    </form>
  );
}
