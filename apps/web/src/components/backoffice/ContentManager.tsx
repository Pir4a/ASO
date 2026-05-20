"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge, Icon, IconButton, Panel } from "./DashboardUI";
import { MediaUpload } from "./MediaUpload";
import { RichTextEditor } from "./RichTextEditor";
import { authFetch } from "@/lib/auth";
import { API_URL, MAX_CAROUSEL_SLIDES } from "@/lib/api";

type CarouselPayload = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  ctaLabel?: string;
  /** CDC XVI.6 — admin marker for the carousel's "image principale". */
  isPrincipal?: boolean;
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
  "w-full rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

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

  /**
   * Mark a single carousel slide as the "image principale" (CDC XVI.6) and
   * clear the flag from every other slide. We only PATCH rows whose flag
   * actually changes to keep the round-trip minimal.
   */
  const togglePrincipal = async (id: string) => {
    const current = carouselBlocks.find((b) => b.id === id);
    if (!current) return;
    const currentlyPrincipal = Boolean((current.payload as CarouselPayload | undefined)?.isPrincipal);
    try {
      if (currentlyPrincipal) {
        // Toggle off — no other state to fix.
        await authFetch(`${API_URL}/content/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ payload: { isPrincipal: false } }),
        });
      } else {
        // Clear any previously-flagged slide first, then set the new one.
        const previous = carouselBlocks.filter(
          (b) => b.id !== id && Boolean((b.payload as CarouselPayload | undefined)?.isPrincipal),
        );
        await Promise.all(
          previous.map((b) =>
            authFetch(`${API_URL}/content/${b.id}`, {
              method: "PATCH",
              body: JSON.stringify({ payload: { isPrincipal: false } }),
            }),
          ),
        );
        await authFetch(`${API_URL}/content/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ payload: { isPrincipal: true } }),
        });
      }
      await load();
      flash("success", currentlyPrincipal ? "Image principale retirée." : "Image principale définie.");
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleSlideDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = carouselBlocks.findIndex((b) => b.id === active.id);
    const newIndex = carouselBlocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(carouselBlocks, oldIndex, newIndex);
    // Optimistic: write the new order locally so the list doesn't snap back.
    setBlocks((prev) => {
      const others = prev.filter((b) => b.type !== "carousel");
      return [...others, ...next.map((b, i) => ({ ...b, order: i }))];
    });
    try {
      await authFetch(`${API_URL}/content/reorder/list`, {
        method: "PATCH",
        body: JSON.stringify({ items: next.map((b, i) => ({ id: b.id, order: i })) }),
      });
      await load();
    } catch {
      flash("error", "Réordonnancement impossible.");
      await load();
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:border-primary hover:text-primary"
          >
            <Icon.Refresh /> Rafraîchir
          </button>
        }
      >
        {loading ? (
          <p className="py-6 text-center text-sm text-foreground/50">Chargement…</p>
        ) : carouselBlocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground/50">Aucune diapositive.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSlideDragEnd}
          >
            <SortableContext
              items={carouselBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3">
                {carouselBlocks.map((block) => {
                  const p = (block.payload ?? {}) as CarouselPayload;
                  const isEditing = editing === block.id;
                  return (
                    <SortableSlideRow
                      key={block.id}
                      id={block.id}
                      disabled={isEditing}
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
                            <div className="h-16 w-24 shrink-0 rounded-lg bg-background" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge tone="violet">#{block.order + 1}</Badge>
                              {p.isPrincipal && (
                                <Badge tone="amber">Image principale</Badge>
                              )}
                              <p className="truncate text-sm font-semibold text-foreground">
                                {p.title || "(sans titre)"}
                              </p>
                            </div>
                            {p.subtitle && (
                              <p className="mt-0.5 truncate text-xs text-foreground/60">{p.subtitle}</p>
                            )}
                            {p.href && (
                              <p className="mt-1 truncate font-mono text-[11px] text-primary">
                                → {p.href}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => togglePrincipal(block.id)}
                                title={
                                  p.isPrincipal
                                    ? "Retirer le statut d'image principale"
                                    : "Définir comme image principale"
                                }
                                aria-pressed={Boolean(p.isPrincipal)}
                                className={`grid h-7 w-7 cursor-pointer place-items-center rounded-md border transition ${
                                  p.isPrincipal
                                    ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200"
                                    : "border-foreground/10 bg-white text-foreground/50 hover:border-amber-300 hover:text-amber-600"
                                }`}
                              >
                                <svg viewBox="0 0 16 16" fill={p.isPrincipal ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" className="h-3.5 w-3.5" aria-hidden="true">
                                  <path d="M8 1.8 9.85 5.6l4.2.6-3.04 2.96.72 4.18L8 11.36 4.27 13.34l.72-4.18L1.95 6.2l4.2-.6L8 1.8Z" />
                                </svg>
                              </button>
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
                      <MediaUpload
                        label="Image"
                        value={editDraft.imageUrl ?? ""}
                        onChange={(url) => setEditDraft((d) => ({ ...d, imageUrl: url }))}
                      />
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
                          className="rounded-lg border border-foreground/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:border-foreground/20"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover"
                        >
                          <Icon.Check /> Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                </SortableSlideRow>
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {carouselBlocks.length < MAX_CAROUSEL_SLIDES && (
          <div className="mt-6 rounded-xl border border-dashed border-foreground/10 bg-background/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
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
              <MediaUpload
                label="Image"
                value={carouselDraft.imageUrl ?? ""}
                onChange={(url) => setCarouselDraft((d) => ({ ...d, imageUrl: url }))}
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
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
            <RichTextEditor
              value={textDraft.body ?? ""}
              onChange={(html) => setTextDraft((d) => ({ ...d, body: html }))}
              ariaLabel="Corps du texte homepage"
              placeholder="Texte enrichi : gras, italique, lien, couleur…"
            />
            <p className="mt-1 text-[11px] text-foreground/50">
              Mise en forme autorisée : gras, italique, lien, couleur du texte.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveHomepageText}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              <Icon.Check /> Enregistrer
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Sortable wrapper for a carousel slide row. The drag handle is a small
 * grip rendered at the left edge; the rest of the row stays interactive
 * (edit / delete / inputs in edit mode).
 */
function SortableSlideRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-2 rounded-xl border border-foreground/10 bg-white p-3"
    >
      <button
        type="button"
        aria-label="Glisser pour réordonner"
        title="Glisser pour réordonner"
        disabled={disabled}
        {...attributes}
        {...listeners}
        className="flex w-7 cursor-grab items-center justify-center rounded-md text-foreground/35 transition hover:bg-foreground/5 hover:text-foreground/70 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <circle cx="6" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="6" cy="8" r="1.2" />
          <circle cx="10" cy="8" r="1.2" />
          <circle cx="6" cy="13" r="1.2" />
          <circle cx="10" cy="13" r="1.2" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
