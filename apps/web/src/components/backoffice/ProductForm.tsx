"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { MediaUpload } from "./MediaUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
}

/** Slim product shape consumed by the edit form. Mirrors the fields the BO
    admin listing endpoint returns; anything unset is treated as the API
    default at create time and untouched on edit. */
export interface EditableProduct {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  category?: { id: string };
  vatRate?: number;
  thumbnailUrl?: string;
  listPriority?: number;
  galleryUrls?: string[];
  specs?: Record<string, string>;
  translations?: Record<string, { name?: string; description?: string }>;
  featured?: boolean;
  featuredOrder?: number;
}

interface SpecRow {
  id: string;
  key: string;
  value: string;
}

function newSpecRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `spec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function specsToRows(specs: Record<string, string> | undefined): SpecRow[] {
  if (!specs) return [];
  return Object.entries(specs).map(([key, value]) => ({
    id: newSpecRowId(),
    key,
    value: String(value),
  }));
}

/** Aligné sur l’API : mail uniquement quand le stock passe de ≤ 0 à > 0. */
function isProductRestock(previousStock: number, nextStock: number): boolean {
  return previousStock <= 0 && nextStock > 0;
}

interface ProductFormProps {
  categories: Category[];
  /** When provided, the form switches to edit mode and PATCHes /products/:id. */
  product?: EditableProduct;
  /** Fires after a successful create or edit. */
  onSaved?: () => void;
  /** Optional cancel handler — when present, renders a Cancel button. */
  onCancel?: () => void;
  /** @deprecated kept for backwards-compat with existing call sites. */
  onCreated?: () => void;
}

export function ProductForm({
  categories,
  product,
  onSaved,
  onCancel,
  onCreated,
}: ProductFormProps) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // In edit mode the slug is whatever the row already stores (likely a
  // user-tuned SEO value); we always treat it as "custom" so toggling the
  // name doesn't silently rewrite a published URL.
  const [useCustomSlug, setUseCustomSlug] = useState(!!product);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(
    product?.price !== undefined ? String(product.price) : "",
  );
  const [stock, setStock] = useState(
    product?.stock !== undefined ? String(product.stock) : "",
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? product?.category?.id ?? "",
  );
  const [vatRate, setVatRate] = useState(
    product?.vatRate !== undefined ? String(product.vatRate) : "20",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl ?? "");
  const [listPriority, setListPriority] = useState(
    product?.listPriority !== undefined ? String(product.listPriority) : "",
  );
  const [galleryUrlsText, setGalleryUrlsText] = useState(
    (product?.galleryUrls ?? []).join("\n"),
  );
  const [specRows, setSpecRows] = useState<SpecRow[]>(() =>
    specsToRows(product?.specs),
  );
  const [translationsJson, setTranslationsJson] = useState(
    product?.translations && Object.keys(product.translations).length > 0
      ? JSON.stringify(product.translations, null, 2)
      : "",
  );
  const [featured, setFeatured] = useState(!!product?.featured);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restockModal, setRestockModal] = useState<{ subscriberCount: number } | null>(
    null,
  );
  const router = useRouter();

  // If the parent swaps the product (e.g. clicks Edit on a different row while
  // the modal is mounted), refresh the inputs from the new source.
  useEffect(() => {
    if (!product) return;
    setName(product.name ?? "");
    setSlug(product.slug ?? "");
    setDescription(product.description ?? "");
    setPrice(product.price !== undefined ? String(product.price) : "");
    setStock(product.stock !== undefined ? String(product.stock) : "");
    setCategoryId(product.categoryId ?? product.category?.id ?? "");
    setVatRate(product.vatRate !== undefined ? String(product.vatRate) : "20");
    setThumbnailUrl(product.thumbnailUrl ?? "");
    setListPriority(
      product.listPriority !== undefined ? String(product.listPriority) : "",
    );
    setGalleryUrlsText((product.galleryUrls ?? []).join("\n"));
    setSpecRows(specsToRows(product.specs));
    setTranslationsJson(
      product.translations && Object.keys(product.translations).length > 0
        ? JSON.stringify(product.translations, null, 2)
        : "",
    );
    setFeatured(!!product.featured);
    setUseCustomSlug(true);
    setError(null);
    setSuccess(null);
  }, [product]);

  const generateSlug = (productName: string) =>
    productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const normalizeSlugInput = (value: string) => generateSlug(value).slice(0, 255);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setName(next);
    // The slug auto-tracks the name only while the user hasn't opted into
    // custom-slug mode (and we always treat edit mode as custom to avoid
    // breaking existing public URLs).
    if (!useCustomSlug && !isEdit) setSlug(generateSlug(next));
  };

  const saveProduct = async (restockSubscriberCount?: number) => {
    let translations: Record<string, { name?: string; description?: string }> | undefined;
      // Build the specs object from the row editor. Empty keys are dropped;
      // when the same key appears twice the last row wins (we surface a
      // warning rather than blocking — the form already trims/dedups before
      // the request, so the server never sees the duplicate).
      const cleaned = specRows
        .map((r) => ({ key: r.key.trim(), value: r.value.trim() }))
        .filter((r) => r.key.length > 0);
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const r of cleaned) {
        if (seen.has(r.key)) duplicates.push(r.key);
        seen.add(r.key);
      }
      if (duplicates.length > 0) {
        const list = Array.from(new Set(duplicates)).join(", ");
        throw new Error(`Caractéristique en double : ${list}. Renomme-la ou supprime la ligne.`);
      }
      const specs: Record<string, string> | undefined =
        cleaned.length > 0 ? Object.fromEntries(cleaned.map((r) => [r.key, r.value])) : undefined;

      if (translationsJson.trim()) {
        try {
          const parsed = JSON.parse(translationsJson) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            translations = Object.fromEntries(
              Object.entries(parsed as Record<string, unknown>).map(([locale, value]) => {
                if (!value || typeof value !== "object" || Array.isArray(value)) {
                  throw new Error("Format de traduction invalide.");
                }
                const row = value as Record<string, unknown>;
                return [
                  locale,
                  {
                    ...(typeof row.name === "string" ? { name: row.name } : {}),
                    ...(typeof row.description === "string" ? { description: row.description } : {}),
                  },
                ];
              }),
            );
          } else {
            throw new Error("Le JSON de traductions doit être un objet.");
          }
        } catch {
          throw new Error(
            "Traductions invalides : JSON attendu (ex. {\"en\":{\"name\":\"...\",\"description\":\"...\"}}).",
          );
        }
      }

      const galleryUrls = galleryUrlsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const token = localStorage.getItem("token");
      const url = isEdit
        ? `${API_URL}/products/${product!.id}`
        : `${API_URL}/products`;
      const method = isEdit ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        categoryId,
        vatRate: Number.parseFloat(vatRate),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        listPriority:
          listPriority.trim() === ""
            ? undefined
            : Math.max(0, parseInt(listPriority, 10) || 0),
        galleryUrls: galleryUrls.length ? galleryUrls : undefined,
        specs,
        translations,
        featured,
      };
      // featuredOrder default is only meaningful at create time; on edit we
      // preserve whatever the row already has unless the user is toggling
      // featured on for the first time.
      if (!isEdit) body.featuredOrder = 0;
      else if (featured && !product!.featured) {
        body.featuredOrder = product!.featuredOrder ?? 0;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.message || (isEdit ? "Mise à jour impossible." : "Erreur lors de l'ajout du produit."),
      );
    }

    let successMsg = isEdit ? "Produit mis à jour." : "Produit ajouté avec succès !";
    if (restockSubscriberCount && restockSubscriberCount > 0) {
      const plural = restockSubscriberCount > 1 ? "s" : "";
      successMsg = `Produit mis à jour. ${restockSubscriberCount} e-mail${plural} d'alerte stock en cours d'envoi.`;
    }

    setSuccess(successMsg);
    if (!isEdit) {
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId("");
      setVatRate("20");
      setThumbnailUrl("");
      setListPriority("");
      setGalleryUrlsText("");
      setSpecRows([]);
      setTranslationsJson("");
      setFeatured(false);
      setUseCustomSlug(false);
    }
    onSaved?.();
    onCreated?.();
    router.refresh();
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nextStock = parseInt(stock, 10);
    const previousStock = product?.stock ?? 0;
    const willRestock =
      isEdit && isProductRestock(previousStock, nextStock);

    if (willRestock) {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const countRes = await fetch(
          `${API_URL}/products/${product!.id}/stock-notify/subscribers/count`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const countData = (await countRes.json()) as { count?: number; message?: string };
        if (!countRes.ok) {
          throw new Error(countData.message || "Impossible de compter les inscrits à l'alerte.");
        }
        setRestockModal({ subscriberCount: countData.count ?? 0 });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await saveProduct();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRestockSave = async () => {
    const count = restockModal?.subscriberCount ?? 0;
    setRestockModal(null);
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await saveProduct(count);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

  return (
    <>
      {restockModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restock-modal-title"
          className="aso-anim-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setRestockModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 90,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            className="aso-anim-modal-card"
            style={{
              width: "100%",
              maxWidth: 440,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
              padding: "20px 22px",
            }}
          >
            <h2
              id="restock-modal-title"
              style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600 }}
            >
              Réapprovisionnement
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.5, color: "#334155" }}>
              Vous passez le stock de{" "}
              <strong>{name || product?.name || "ce produit"}</strong> à une valeur positive.
              {restockModal.subscriberCount > 0 ? (
                <>
                  {" "}
                  <strong>{restockModal.subscriberCount}</strong> personne
                  {restockModal.subscriberCount > 1 ? "s" : ""} inscrite
                  {restockModal.subscriberCount > 1 ? "s" : ""} à l&apos;alerte recevront un
                  e-mail « de nouveau en stock ». Les inscriptions restent actives pour une
                  prochaine rupture.
                </>
              ) : (
                <> Aucune inscription à l&apos;alerte pour ce produit — aucun e-mail ne sera envoyé.</>
              )}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setRestockModal(null)}
                className="inline-flex items-center rounded-lg border border-foreground/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm transition hover:bg-foreground/5 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmRestockSave()}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : "Confirmer et enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Nom du produit</label>
          <input id="name" type="text" className={inputCls} value={name} onChange={handleNameChange} required />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>Slug (URL)</label>
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-xs text-foreground/70">
              <input
                type="checkbox"
                checked={useCustomSlug}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setUseCustomSlug(checked);
                  if (!checked) setSlug(generateSlug(name));
                }}
              />
              URL personnalisée (slug SEO)
            </label>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-lg border border-foreground/10 bg-background px-2 text-xs text-foreground/60">
                /products/
              </span>
              <input
                id="slug"
                type="text"
                className={inputCls}
                value={slug}
                onChange={(e) => setSlug(normalizeSlugInput(e.target.value))}
                disabled={!useCustomSlug}
                required
              />
              <button
                type="button"
                className="rounded-lg border border-foreground/15 px-2.5 text-xs font-semibold text-foreground/70 hover:bg-background"
                onClick={() => setSlug(generateSlug(name))}
                title="Régénérer depuis le nom"
              >
                Auto
              </button>
            </div>
            <p className="text-[11px] text-foreground/55">
              URL finale : <span className="font-mono">/products/{slug || "..."}</span>
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea id="description" rows={3} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div>
          <label htmlFor="vatRate" className={labelCls}>TVA (%)</label>
          <select id="vatRate" className={inputCls} value={vatRate} onChange={(e) => setVatRate(e.target.value)}>
            <option value="20">20 % (normal)</option>
            <option value="10">10 % (intermédiaire)</option>
            <option value="5.5">5,5 % (réduit)</option>
            <option value="0">0 % (exonéré)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <MediaUpload
            label="Miniature"
            value={thumbnailUrl}
            onChange={(url) => setThumbnailUrl(url)}
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
        <label className={labelCls} style={{ display: "block", marginBottom: 8 }}>
          Galerie produit (téléversez plusieurs images)
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {galleryUrlsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((url, i) => (
              <div
                key={`${url}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid var(--bo-border)",
                  background: "white",
                  borderRadius: 6,
                  padding: 6,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{ height: 40, width: 60, objectFit: "cover", borderRadius: 3, border: "1px solid var(--bo-border)" }}
                />
                <span
                  style={{ flex: 1, fontSize: 11, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = galleryUrlsText
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                      .filter((_, idx) => idx !== i);
                    setGalleryUrlsText(next.join("\n"));
                  }}
                  className="bo-btn"
                  style={{ padding: "2px 8px", fontSize: 11 }}
                >
                  Retirer
                </button>
              </div>
            ))}
          <MediaUpload
            label=""
            value=""
            onChange={(url) => {
              if (!url) return;
              const next = galleryUrlsText.trim()
                ? `${galleryUrlsText.trim()}\n${url}`
                : url;
              setGalleryUrlsText(next);
            }}
            previewHeight={70}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Specs techniques</label>
        <p className="mb-2 text-[11px] text-foreground/55">
          Ajoute une ligne par caractéristique (ex. Puissance · 400 W).
        </p>
        {specRows.length > 0 ? (
          <ul className="mb-2 space-y-2">
            {specRows.map((row, idx) => (
              <li key={row.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSpecRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, key: next } : r)),
                    );
                  }}
                  placeholder="Caractéristique"
                  aria-label={`Caractéristique ${idx + 1} — clé`}
                  className={`${inputCls} flex-1`}
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSpecRows((prev) =>
                      prev.map((r) => (r.id === row.id ? { ...r, value: next } : r)),
                    );
                  }}
                  placeholder="Valeur"
                  aria-label={`Caractéristique ${idx + 1} — valeur`}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setSpecRows((prev) => prev.filter((r) => r.id !== row.id))
                  }
                  aria-label={`Supprimer la caractéristique ${idx + 1}`}
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-foreground/10 bg-white text-foreground/60 shadow-sm transition hover:border-error/40 hover:bg-error/5 hover:text-error"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9h5L11 4M7 6.5v4.5M9 6.5v4.5" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 rounded-lg border border-dashed border-foreground/15 bg-foreground/[0.02] px-3 py-3 text-xs text-foreground/55">
            Aucune caractéristique pour l&apos;instant.
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            setSpecRows((prev) => [...prev, { id: newSpecRowId(), key: "", value: "" }])
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/70 shadow-sm transition hover:border-primary/40 hover:text-primary"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
          Ajouter une caractéristique
        </button>
      </div>

      <div>
        <label htmlFor="translationsJson" className={labelCls}>
          Traductions produit (JSON objet par locale)
        </label>
        <textarea
          id="translationsJson"
          rows={5}
          className={`${inputCls} font-mono text-xs`}
          value={translationsJson}
          onChange={(e) => setTranslationsJson(e.target.value)}
          placeholder='{"en":{"name":"Ultrasound probe","description":"Portable diagnostic probe"},"ar":{"name":"...","description":"..."}}'
        />
      </div>

      <div className="flex items-end">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/80">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          Mettre en vedette (sélection homepage)
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {success}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm transition hover:bg-foreground/5"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "Enregistrement…"
              : "Ajout…"
            : isEdit
              ? "Enregistrer"
              : "Ajouter le produit"}
        </button>
      </div>
    </form>
    </>
  );
}
