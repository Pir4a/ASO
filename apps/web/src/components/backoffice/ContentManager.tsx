"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Icon, IconButton, Panel } from "./DashboardUI";
import { authFetch } from "@/lib/auth";
import { API_URL, MAX_CAROUSEL_SLIDES } from "@/lib/api";

type CarouselPayload = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  ctaLabel?: string;
};

type HomepageTextPayload = {
  headline?: string;
  body?: string;
};

type ContentBlock = {
  id: string;
  type: "carousel" | "homepage_text" | "category_image";
  payload?: Record<string, unknown>;
  order: number;
};

interface ContentManagerProps {
  flash: (kind: "success" | "error", text: string) => void;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function ContentManager({ flash }: ContentManagerProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [carouselDraft, setCarouselDraft] = useState<CarouselPayload>({
    title: "",
    subtitle: "",
    imageUrl: "",
    href: "",
    ctaLabel: "",
  });
  const [textDraft, setTextDraft] = useState<HomepageTextPayload>({
    headline: "",
    body: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CarouselPayload>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/content`);
      if (!res.ok) throw new Error();
      const data: ContentBlock[] = await res.json();
      setBlocks(data);
      const existingText = data.find((b) => b.type === "homepage_text");
      if (existingText) {
        setTextDraft({
          headline: (existingText.payload?.headline as string) ?? "",
          body: (existingText.payload?.body as string) ?? "",
        });
      }
    } catch {
      flash("error", "Chargement du contenu impossible.");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    void load();
  }, [load]);

  const carouselBlocks = [...blocks]
    .filter((b) => b.type === "carousel")
    .sort((a, b) => a.order - b.order);
  const homepageText = blocks.find((b) => b.type === "homepage_text") ?? null;

  const createCarousel = async () => {
    if (!carouselDraft.title || !carouselDraft.imageUrl) {
      flash("error", "Titre et image requis.");
      return;
    }
    if (carouselBlocks.length >= MAX_CAROUSEL_SLIDES) {
      flash("error", `Limite de ${MAX_CAROUSEL_SLIDES} diapositives atteinte.`);
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/content`, {
        method: "POST",
        body: JSON.stringify({
          type: "carousel",
          payload: carouselDraft,
          order: carouselBlocks.length,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Création impossible");
      }
      setCarouselDraft({ title: "", subtitle: "", imageUrl: "", href: "", ctaLabel: "" });
      await load();
      flash("success", "Diapositive créée.");
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "Erreur inattendue.");
    }
  };

  const updateBlock = async (id: string, patch: Partial<ContentBlock>) => {
    try {
      const res = await authFetch(`${API_URL}/content/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Mise à jour impossible");
      await load();
      flash("success", "Mis à jour.");
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Supprimer ce bloc ?")) return;
    try {
      const res = await authFetch(`${API_URL}/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
      flash("success", "Supprimé.");
    } catch {
      flash("error", "Suppression impossible.");
    }
  };

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const idx = carouselBlocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= carouselBlocks.length) return;
    const next = [...carouselBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    try {
      await authFetch(`${API_URL}/content/reorder/list`, {
        method: "PATCH",
        body: JSON.stringify({ items: next.map((b, i) => ({ id: b.id, order: i })) }),
      });
      await load();
    } catch {
      flash("error", "Réordonnancement impossible.");
    }
  };

  const startEditing = (block: ContentBlock) => {
    setEditing(block.id);
    setEditDraft({
      title: (block.payload?.title as string) ?? "",
      subtitle: (block.payload?.subtitle as string) ?? "",
      imageUrl: (block.payload?.imageUrl as string) ?? "",
      href: (block.payload?.href as string) ?? "",
      ctaLabel: (block.payload?.ctaLabel as string) ?? "",
    });
  };

  const saveEditing = async () => {
    if (!editing) return;
    await updateBlock(editing, { payload: editDraft });
    setEditing(null);
  };

  const saveHomepageText = async () => {
    try {
      if (homepageText) {
        await updateBlock(homepageText.id, { payload: textDraft });
      } else {
        const res = await authFetch(`${API_URL}/content`, {
          method: "POST",
          body: JSON.stringify({ type: "homepage_text", payload: textDraft, order: 0 }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Création impossible");
        }
        await load();
        flash("success", "Texte homepage enregistré.");
      }
    } catch (err) {
      flash("error", err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Carrousel (3 max)"
        subtitle={`${carouselBlocks.length}/${MAX_CAROUSEL_SLIDES} diapositive${carouselBlocks.length > 1 ? "s" : ""} publiée${carouselBlocks.length > 1 ? "s" : ""}`}
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#00a8b5] hover:text-[#00a8b5]"
          >
            <Icon.Refresh /> Rafraîchir
          </button>
        }
      >
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>
        ) : carouselBlocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Aucune diapositive.</p>
        ) : (
          <ul className="space-y-3">
            {carouselBlocks.map((block) => {
              const p = (block.payload ?? {}) as CarouselPayload;
              const isEditing = editing === block.id;
              return (
                <li
                  key={block.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  {!isEditing ? (
                    <div className="flex items-start gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.title ?? ""}
                          className="h-16 w-24 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-24 shrink-0 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge tone="violet">#{block.order + 1}</Badge>
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {p.title || "(sans titre)"}
                          </p>
                        </div>
                        {p.subtitle && (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{p.subtitle}</p>
                        )}
                        {p.href && (
                          <p className="mt-1 truncate font-mono text-[11px] text-[#00a8b5]">
                            → {p.href}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <div className="flex gap-1">
                          <IconButton onClick={() => moveSlide(block.id, "up")} title="Monter">
                            <Icon.ArrowUp />
                          </IconButton>
                          <IconButton onClick={() => moveSlide(block.id, "down")} title="Descendre">
                            <Icon.ArrowDown />
                          </IconButton>
                        </div>
                        <div className="flex gap-1">
                          <IconButton onClick={() => startEditing(block)} title="Éditer">
                            <Icon.Edit />
                          </IconButton>
                          <IconButton tone="rose" onClick={() => deleteBlock(block.id)} title="Supprimer">
                            <Icon.Trash />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className={labelCls}>Titre</label>
                          <input
                            className={inputCls}
                            value={editDraft.title ?? ""}
                            onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Sous-titre</label>
                          <input
                            className={inputCls}
                            value={editDraft.subtitle ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, subtitle: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>URL image</label>
                        <input
                          className={inputCls}
                          value={editDraft.imageUrl ?? ""}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, imageUrl: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className={labelCls}>Lien (href)</label>
                          <input
                            className={inputCls}
                            placeholder="/products/slug ou https://…"
                            value={editDraft.href ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, href: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Libellé CTA</label>
                          <input
                            className={inputCls}
                            value={editDraft.ctaLabel ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, ctaLabel: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#33bfc9]"
                        >
                          <Icon.Check /> Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {carouselBlocks.length < MAX_CAROUSEL_SLIDES && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ajouter une diapositive
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelCls}>Titre</label>
                <input
                  className={inputCls}
                  value={carouselDraft.title ?? ""}
                  onChange={(e) => setCarouselDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Sous-titre</label>
                <input
                  className={inputCls}
                  value={carouselDraft.subtitle ?? ""}
                  onChange={(e) =>
                    setCarouselDraft((d) => ({ ...d, subtitle: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>URL image</label>
              <input
                className={inputCls}
                placeholder="https://…"
                value={carouselDraft.imageUrl ?? ""}
                onChange={(e) =>
                  setCarouselDraft((d) => ({ ...d, imageUrl: e.target.value }))
                }
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelCls}>Lien cliquable (href)</label>
                <input
                  className={inputCls}
                  placeholder="/products/slug"
                  value={carouselDraft.href ?? ""}
                  onChange={(e) => setCarouselDraft((d) => ({ ...d, href: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Libellé CTA</label>
                <input
                  className={inputCls}
                  placeholder="Découvrir"
                  value={carouselDraft.ctaLabel ?? ""}
                  onChange={(e) =>
                    setCarouselDraft((d) => ({ ...d, ctaLabel: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={createCarousel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#33bfc9]"
              >
                <Icon.Plus /> Créer la diapositive
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="Texte homepage"
        subtitle="Affiché sous le carrousel"
      >
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Titre (headline)</label>
            <input
              className={inputCls}
              value={textDraft.headline ?? ""}
              onChange={(e) => setTextDraft((d) => ({ ...d, headline: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Corps du texte</label>
            <textarea
              rows={3}
              className={inputCls}
              value={textDraft.body ?? ""}
              onChange={(e) => setTextDraft((d) => ({ ...d, body: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveHomepageText}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#33bfc9]"
            >
              <Icon.Check /> Enregistrer
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
