"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { ProductForm } from "@/components/backoffice/ProductForm";
import { Badge, Icon, IconButton, Panel, StatCard } from "@/components/backoffice/DashboardUI";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/auth";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
};

type Product = {
  id: string;
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  status?: "in_stock" | "low_stock" | "out_of_stock" | "new";
  thumbnailUrl?: string;
  category?: { id: string; name: string };
  categoryId?: string;
};

type AdminUser = {
  id: string;
  email: string;
  role: "customer" | "admin";
  status: "active" | "inactive" | "pending";
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
};

type ContactMessage = {
  id: string;
  subject: string;
  email: string;
  message: string;
  createdAt: string;
};

type Section = "overview" | "products" | "categories" | "users" | "messages";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const SECTION_META: Record<Section, { label: string; hint: string; icon: React.ReactNode }> = {
  overview: { label: "Overview", hint: "Indicateurs globaux", icon: <Icon.Overview /> },
  products: { label: "Produits", hint: "Catalogue & matériel", icon: <Icon.Products /> },
  categories: { label: "Catégories", hint: "Arborescence & ordre", icon: <Icon.Categories /> },
  users: { label: "Utilisateurs", hint: "Clients & admins", icon: <Icon.Users /> },
  messages: { label: "Messages", hint: "Contacts & support", icon: <Icon.Messages /> },
};

function BackofficeDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("overview");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });
  const [showProductForm, setShowProductForm] = useState(false);

  const flash = (kind: "success" | "error", text: string) => {
    setFeedback({ kind, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  /* ------------------------------- Loaders -------------------------------- */

  const loadUsers = async (q?: string) => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await authFetch(`${API_URL}/users?${params.toString()}`);
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs.");
      setUsers(await res.json());
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await authFetch(`${API_URL}/categories?includeInactive=true`);
      if (!res.ok) throw new Error();
      setCategories(await res.json());
    } catch {
      flash("error", "Chargement des catégories impossible.");
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      flash("error", "Chargement des produits impossible.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadContactMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await authFetch(`${API_URL}/contact/admin`);
      if (!res.ok) throw new Error();
      setContactMessages(await res.json());
    } catch {
      flash("error", "Chargement des messages impossible.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadCategories(), loadProducts(), loadUsers(), loadContactMessages()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- Actions -------------------------------- */

  const runAction = async (
    userId: string,
    action: "activate" | "deactivate" | "delete" | "promote" | "demote" | "reset",
  ) => {
    try {
      if (action === "activate" || action === "deactivate") {
        await authFetch(`${API_URL}/users/${userId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: action === "activate" ? "active" : "inactive" }),
        });
      } else if (action === "delete") {
        await authFetch(`${API_URL}/users/${userId}`, { method: "DELETE" });
      } else if (action === "promote" || action === "demote") {
        await authFetch(`${API_URL}/users/${userId}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: action === "promote" ? "admin" : "customer" }),
        });
      } else {
        await authFetch(`${API_URL}/users/${userId}/reset-password`, { method: "POST" });
      }
      await loadUsers(search);
      flash("success", "Action effectuée.");
    } catch {
      flash("error", "Action échouée.");
    }
  };

  const createCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      flash("error", "Nom et slug requis.");
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/categories`, {
        method: "POST",
        body: JSON.stringify({ ...newCategory, order: categories.length }),
      });
      if (!res.ok) throw new Error();
      setNewCategory({ name: "", slug: "", description: "" });
      await loadCategories();
      flash("success", "Catégorie créée.");
    } catch {
      flash("error", "Erreur création catégorie.");
    }
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    await authFetch(`${API_URL}/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    await loadCategories();
  };

  const deleteCategory = async (id: string) => {
    await authFetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
    await loadCategories();
    flash("success", "Catégorie supprimée.");
  };

  const moveCategory = async (id: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;
    await authFetch(`${API_URL}/categories/reorder/list`, {
      method: "PATCH",
      body: JSON.stringify({ items: sorted.map((c, i) => ({ id: c.id, order: i })) }),
    });
    await loadCategories();
  };

  const bulkCategoryAction = async (action: "activate" | "deactivate" | "delete") => {
    if (!selectedCategoryIds.length) return;
    await authFetch(`${API_URL}/categories/bulk`, {
      method: "POST",
      body: JSON.stringify({ ids: selectedCategoryIds, action }),
    });
    setSelectedCategoryIds([]);
    await loadCategories();
    flash("success", `Action groupée appliquée.`);
  };

  /* ------------------------------- Derived -------------------------------- */

  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const activeCategories = categories.filter((c) => c.isActive).length;

  const filteredProducts = products.filter((p) =>
    (p.name ?? "").toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku ?? "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  const filteredCategories = [...categories]
    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  const recentMessages = [...contactMessages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Category distribution for products
  const categoryDist = categories
    .map((c) => ({
      name: c.name,
      count: products.filter((p) => p.category?.id === c.id || p.categoryId === c.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxDist = Math.max(1, ...categoryDist.map((d) => d.count));

  /* --------------------------------- UI ----------------------------------- */

  const navItem = (key: Section) => {
    const meta = SECTION_META[key];
    const active = section === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSection(key)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? "bg-linear-to-r from-[#00a8b5] to-[#33bfc9] text-white shadow-md shadow-[#00a8b5]/20"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className={active ? "text-white" : "text-slate-400 group-hover:text-[#00a8b5]"}>{meta.icon}</span>
        <span className="flex-1 text-left">{meta.label}</span>
        {key === "messages" && contactMessages.length > 0 && (
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
              active ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"
            }`}
          >
            {contactMessages.length}
          </span>
        )}
      </button>
    );
  };

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const productStatusBadge = (p: Product) => {
    const stock = p.stock ?? 0;
    if (stock === 0) return <Badge tone="rose">Rupture</Badge>;
    if (stock < 5) return <Badge tone="amber">Stock faible</Badge>;
    if (p.status === "new") return <Badge tone="violet">Nouveau</Badge>;
    return <Badge tone="emerald">En stock</Badge>;
  };

  return (
    <div className="-mt-8 min-h-screen">
      {/* Page background tint */}
      <div className="bg-linear-to-br from-slate-50 via-slate-50 to-[#d4f4f7]/30 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.08),0_2px_4px_-2px_rgb(0,0,0,0.05)]">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#00a8b5] to-[#33bfc9] text-white shadow-md">
                  <Icon.Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">Admin Panel</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email ?? "admin"}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {(Object.keys(SECTION_META) as Section[]).map((k) => navItem(k))}
              </nav>
              <div className="mt-4 rounded-xl bg-linear-to-br from-[#00a8b5]/10 to-[#33bfc9]/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00a8b5]">Statut système</p>
                <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Tous les services actifs
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-6">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.08),0_2px_4px_-2px_rgb(0,0,0,0.05)]">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Dashboard</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-[#00a8b5]">{SECTION_META[section].label}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {section === "overview" ? `Bonjour ${user?.email?.split("@")[0] ?? "Admin"} 👋` : SECTION_META[section].label}
                </h1>
                <p className="text-xs text-slate-500 first-letter:capitalize">{today}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void Promise.all([loadCategories(), loadProducts(), loadUsers(), loadContactMessages()])}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#00a8b5] hover:text-[#00a8b5]"
                >
                  <Icon.Refresh />
                  Rafraîchir
                </button>
                <div className="relative">
                  <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#00a8b5] hover:text-[#00a8b5]">
                    <Icon.Bell />
                    {contactMessages.length > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {contactMessages.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Flash feedback */}
            {feedback && (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm shadow-sm ${
                  feedback.kind === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {feedback.kind === "success" ? <Icon.Check /> : <Icon.X />}
                {feedback.text}
              </div>
            )}

            {/* OVERVIEW */}
            {section === "overview" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Produits"
                    value={products.length}
                    trend={`${products.length - outOfStockCount} dispo`}
                    hint={`${outOfStockCount} en rupture`}
                    tone="primary"
                    icon={<Icon.Products />}
                  />
                  <StatCard
                    label="Catégories"
                    value={categories.length}
                    hint={`${activeCategories} actives`}
                    tone="violet"
                    icon={<Icon.Categories />}
                  />
                  <StatCard
                    label="Utilisateurs"
                    value={users.length}
                    trend={`${activeUsers} actifs`}
                    hint={`${adminCount} admin${adminCount > 1 ? "s" : ""}`}
                    tone="emerald"
                    icon={<Icon.Users />}
                  />
                  <StatCard
                    label="Messages"
                    value={contactMessages.length}
                    hint="Contacts non lus"
                    tone={contactMessages.length > 0 ? "amber" : "sky"}
                    icon={<Icon.Messages />}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <Panel title="Répartition du catalogue" subtitle="Produits par catégorie" className="lg:col-span-2">
                    {categoryDist.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">Pas encore de données.</p>
                    ) : (
                      <div className="space-y-3">
                        {categoryDist.map((d) => (
                          <div key={d.name}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">{d.name}</span>
                              <span className="font-semibold text-slate-500">{d.count}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-[#00a8b5] to-[#33bfc9]"
                                style={{ width: `${(d.count / maxDist) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  <Panel title="Alertes stock" subtitle="Produits à surveiller">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Rupture</p>
                          <p className="text-2xl font-bold text-rose-700">{outOfStockCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                          <Icon.X className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Stock faible</p>
                          <p className="text-2xl font-bold text-amber-700">{lowStockCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Icon.TrendUp className="h-5 w-5" />
                        </div>
                      </div>
                      <button
                        onClick={() => setSection("products")}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition hover:border-[#00a8b5] hover:text-[#00a8b5]"
                      >
                        Voir les produits →
                      </button>
                    </div>
                  </Panel>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel
                    title="Derniers messages"
                    subtitle={`${contactMessages.length} au total`}
                    actions={
                      <button
                        onClick={() => setSection("messages")}
                        className="text-xs font-semibold text-[#00a8b5] hover:underline"
                      >
                        Voir tout
                      </button>
                    }
                  >
                    {recentMessages.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">Aucun message pour le moment.</p>
                    ) : (
                      <ul className="-my-2 divide-y divide-slate-100">
                        {recentMessages.map((m) => (
                          <li key={m.id} className="flex items-start gap-3 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00a8b5]/10 text-[11px] font-bold uppercase text-[#00a8b5]">
                              {m.email.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">{m.subject}</p>
                                <span className="shrink-0 text-[10px] text-slate-400">
                                  {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                              <p className="truncate text-xs text-slate-500">{m.email}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-slate-600">{m.message}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>

                  <Panel title="Actions rapides" subtitle="Raccourcis admin">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setSection("products");
                          setShowProductForm(true);
                        }}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#00a8b5] hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00a8b5]/10 text-[#00a8b5] transition group-hover:bg-[#00a8b5] group-hover:text-white">
                          <Icon.Plus />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Nouveau produit</p>
                        <p className="text-xs text-slate-500">Ajouter au catalogue</p>
                      </button>
                      <button
                        onClick={() => setSection("categories")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-500 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                          <Icon.Categories />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Catégories</p>
                        <p className="text-xs text-slate-500">Organiser l'arborescence</p>
                      </button>
                      <button
                        onClick={() => setSection("users")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-500 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                          <Icon.Users />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Utilisateurs</p>
                        <p className="text-xs text-slate-500">Gérer les comptes</p>
                      </button>
                      <button
                        onClick={() => setSection("messages")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-500 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
                          <Icon.Messages />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Messages</p>
                        <p className="text-xs text-slate-500">Boîte de réception</p>
                      </button>
                    </div>
                  </Panel>
                </div>
              </>
            )}

            {/* PRODUCTS */}
            {section === "products" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total" value={products.length} tone="primary" icon={<Icon.Products />} />
                  <StatCard label="Stock faible" value={lowStockCount} tone="amber" icon={<Icon.TrendUp />} />
                  <StatCard label="En rupture" value={outOfStockCount} tone="rose" icon={<Icon.X />} />
                </div>

                {showProductForm && (
                  <Panel
                    title="Ajouter un produit"
                    subtitle="Nouveau matériel médical"
                    actions={
                      <IconButton onClick={() => setShowProductForm(false)} title="Fermer">
                        <Icon.X /> Fermer
                      </IconButton>
                    }
                  >
                    <ProductForm
                      categories={categories}
                      onCreated={() => {
                        void loadProducts();
                        setShowProductForm(false);
                        flash("success", "Produit ajouté.");
                      }}
                    />
                  </Panel>
                )}

                <Panel
                  title="Catalogue"
                  subtitle={`${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""}`}
                  actions={
                    <>
                      <div className="relative">
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Rechercher…"
                          className="w-48 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                        />
                      </div>
                      <button
                        onClick={() => setShowProductForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#33bfc9]"
                      >
                        <Icon.Plus /> Ajouter
                      </button>
                    </>
                  }
                >
                  {loadingProducts ? (
                    <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Aucun produit trouvé.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="py-2 pr-4 font-semibold">Produit</th>
                            <th className="py-2 pr-4 font-semibold">SKU</th>
                            <th className="py-2 pr-4 font-semibold">Catégorie</th>
                            <th className="py-2 pr-4 font-semibold">Prix</th>
                            <th className="py-2 pr-4 font-semibold">Stock</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="transition hover:bg-slate-50">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                                    {p.thumbnailUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.thumbnailUrl} alt={p.name ?? ""} className="h-full w-full rounded-lg object-cover" />
                                    ) : (
                                      (p.name ?? "?").slice(0, 2)
                                    )}
                                  </div>
                                  <span className="font-medium text-slate-800">{p.name ?? "—"}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-mono text-[11px] text-slate-500">{p.sku ?? "—"}</td>
                              <td className="py-3 pr-4 text-slate-600">{p.category?.name ?? "—"}</td>
                              <td className="py-3 pr-4 font-semibold text-slate-800">
                                {typeof p.price === "number" ? `${p.price.toFixed(2)} €` : "—"}
                              </td>
                              <td className="py-3 pr-4 text-slate-700">{p.stock ?? 0}</td>
                              <td className="py-3 pr-4">{productStatusBadge(p)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}

            {/* CATEGORIES */}
            {section === "categories" && (
              <>
                <Panel title="Créer une catégorie" subtitle="Ajouter à l'arborescence">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nom"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                    />
                    <input
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="slug-url"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                    />
                    <input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={createCategory}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#33bfc9]"
                    >
                      <Icon.Plus /> Créer
                    </button>
                  </div>
                </Panel>

                <Panel
                  title="Gestion des catégories"
                  subtitle={`${filteredCategories.length} catégorie${filteredCategories.length > 1 ? "s" : ""} · ${activeCategories} active${activeCategories > 1 ? "s" : ""}`}
                  actions={
                    <>
                      <div className="relative">
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Filtrer…"
                          className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                        />
                      </div>
                      {selectedCategoryIds.length > 0 && (
                        <>
                          <span className="text-xs font-medium text-slate-500">
                            {selectedCategoryIds.length} sélectionnée{selectedCategoryIds.length > 1 ? "s" : ""}
                          </span>
                          <IconButton tone="emerald" onClick={() => bulkCategoryAction("activate")}>
                            <Icon.Check /> Activer
                          </IconButton>
                          <IconButton onClick={() => bulkCategoryAction("deactivate")}>
                            <Icon.X /> Désactiver
                          </IconButton>
                          <IconButton tone="rose" onClick={() => bulkCategoryAction("delete")}>
                            <Icon.Trash /> Supprimer
                          </IconButton>
                        </>
                      )}
                    </>
                  }
                >
                  {filteredCategories.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Aucune catégorie.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="w-10 py-2"></th>
                            <th className="py-2 pr-4 font-semibold">Ordre</th>
                            <th className="py-2 pr-4 font-semibold">Nom</th>
                            <th className="py-2 pr-4 font-semibold">Slug</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                            <th className="py-2 pr-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCategories.map((cat) => (
                            <tr key={cat.id} className="transition hover:bg-slate-50">
                              <td className="py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(cat.id)}
                                  onChange={(e) =>
                                    setSelectedCategoryIds((prev) =>
                                      e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-[#00a8b5] focus:ring-[#00a8b5]"
                                />
                              </td>
                              <td className="py-3 pr-4 text-xs font-mono text-slate-500">#{cat.order}</td>
                              <td className="py-3 pr-4 font-medium text-slate-800">{cat.name}</td>
                              <td className="py-3 pr-4 font-mono text-[11px] text-slate-500">{cat.slug}</td>
                              <td className="py-3 pr-4">
                                {cat.isActive ? <Badge tone="emerald">Active</Badge> : <Badge tone="slate">Inactive</Badge>}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex justify-end gap-1">
                                  <IconButton onClick={() => moveCategory(cat.id, "up")} title="Monter">
                                    <Icon.ArrowUp />
                                  </IconButton>
                                  <IconButton onClick={() => moveCategory(cat.id, "down")} title="Descendre">
                                    <Icon.ArrowDown />
                                  </IconButton>
                                  <IconButton
                                    tone={cat.isActive ? "slate" : "emerald"}
                                    onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                                  >
                                    {cat.isActive ? "Désactiver" : "Activer"}
                                  </IconButton>
                                  <IconButton onClick={() => updateCategory(cat.id, { name: `${cat.name} (edit)` })} title="Éditer">
                                    <Icon.Edit />
                                  </IconButton>
                                  <IconButton tone="rose" onClick={() => deleteCategory(cat.id)} title="Supprimer">
                                    <Icon.Trash />
                                  </IconButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}

            {/* USERS */}
            {section === "users" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total" value={users.length} tone="primary" icon={<Icon.Users />} />
                  <StatCard label="Actifs" value={activeUsers} tone="emerald" icon={<Icon.Check />} />
                  <StatCard label="Administrateurs" value={adminCount} tone="violet" icon={<Icon.Shield />} />
                </div>

                <Panel
                  title="Gestion des utilisateurs"
                  subtitle={`${users.length} compte${users.length > 1 ? "s" : ""}`}
                  actions={
                    <>
                      <div className="relative">
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
                          placeholder="Rechercher un email…"
                          className="w-60 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#00a8b5] focus:ring-2 focus:ring-[#00a8b5]/15"
                        />
                      </div>
                      <button
                        onClick={() => loadUsers(search)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#33bfc9]"
                      >
                        Rechercher
                      </button>
                    </>
                  }
                >
                  {loadingUsers ? (
                    <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>
                  ) : users.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">Aucun utilisateur.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="py-2 pr-4 font-semibold">Utilisateur</th>
                            <th className="py-2 pr-4 font-semibold">Rôle</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                            <th className="py-2 pr-4 font-semibold">Dernière connexion</th>
                            <th className="py-2 pr-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.map((u) => (
                            <tr key={u.id} className="transition hover:bg-slate-50">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#00a8b5]/20 to-[#33bfc9]/10 text-[11px] font-bold uppercase text-[#00a8b5]">
                                    {u.email.slice(0, 2)}
                                  </div>
                                  <span className="font-medium text-slate-800">{u.email}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                {u.role === "admin" ? (
                                  <Badge tone="violet">
                                    <Icon.Shield /> Admin
                                  </Badge>
                                ) : (
                                  <Badge tone="slate">Client</Badge>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                {u.status === "active" ? (
                                  <Badge tone="emerald">Actif</Badge>
                                ) : u.status === "pending" ? (
                                  <Badge tone="amber">En attente</Badge>
                                ) : (
                                  <Badge tone="rose">Inactif</Badge>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-xs text-slate-500">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex flex-wrap justify-end gap-1">
                                  <IconButton
                                    tone={u.isActive ? "slate" : "emerald"}
                                    onClick={() => runAction(u.id, u.isActive ? "deactivate" : "activate")}
                                  >
                                    {u.isActive ? "Désactiver" : "Activer"}
                                  </IconButton>
                                  <IconButton
                                    tone="primary"
                                    onClick={() => runAction(u.id, u.role === "admin" ? "demote" : "promote")}
                                  >
                                    <Icon.Shield />
                                    {u.role === "admin" ? "Retirer" : "Promouvoir"}
                                  </IconButton>
                                  <IconButton onClick={() => runAction(u.id, "reset")} title="Reset mot de passe">
                                    <Icon.Key />
                                  </IconButton>
                                  <IconButton tone="rose" onClick={() => runAction(u.id, "delete")} title="Supprimer">
                                    <Icon.Trash />
                                  </IconButton>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}

            {/* MESSAGES */}
            {section === "messages" && (
              <Panel
                title="Messages contact"
                subtitle={`${contactMessages.length} message${contactMessages.length > 1 ? "s" : ""}`}
                actions={
                  <button
                    onClick={loadContactMessages}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00a8b5] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#33bfc9]"
                  >
                    <Icon.Refresh /> Rafraîchir
                  </button>
                }
              >
                {loadingMessages ? (
                  <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>
                ) : contactMessages.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Icon.Messages className="h-7 w-7" />
                    </div>
                    <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
                  </div>
                ) : (
                  <ul className="-my-3 divide-y divide-slate-100">
                    {contactMessages
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((msg) => (
                        <li key={msg.id} className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a8b5]/10 text-xs font-bold uppercase text-[#00a8b5]">
                              {msg.email.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{msg.subject}</p>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(msg.createdAt).toLocaleString("fr-FR")}
                                </span>
                              </div>
                              <a
                                href={`mailto:${msg.email}`}
                                className="text-xs font-medium text-[#00a8b5] hover:underline"
                              >
                                {msg.email}
                              </a>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{msg.message}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </Panel>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BackofficePage() {
  return (
    <AuthGuard requiredRole="admin">
      <BackofficeDashboard />
    </AuthGuard>
  );
}
