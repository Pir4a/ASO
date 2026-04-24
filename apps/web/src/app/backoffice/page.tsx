"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { ProductForm } from "@/components/backoffice/ProductForm";
import { ContentManager } from "@/components/backoffice/ContentManager";
import { DashboardCharts, type AdminDashboardData } from "@/components/backoffice/DashboardCharts";
import { Badge, Icon, IconButton, Panel, StatCard } from "@/components/backoffice/DashboardUI";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/auth";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
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
  featured?: boolean;
  featuredOrder?: number;
  category?: { id: string; name: string };
  categoryId?: string;
  vatRate?: number;
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

type AdminOrderListRow = {
  id: string;
  userId: string;
  status: string;
  total: number;
  currency: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  customerEmail: string | null;
  lineCount: number;
};

type AdminOrderDetail = {
  id: string;
  userId: string;
  status: string;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  paymentStatus?: string;
  statusHistory: { status: string; at: string }[];
  createdAt: string;
  updatedAt: string;
  shippingAddress?: unknown;
  billingAddress?: unknown;
  items: {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    price: number;
    currency: string;
  }[];
};

type Section = "overview" | "products" | "categories" | "content" | "orders" | "users" | "messages";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const SECTION_META: Record<Section, { label: string; hint: string; icon: React.ReactNode }> = {
  overview: { label: "Overview", hint: "Indicateurs globaux", icon: <Icon.Overview /> },
  products: { label: "Produits", hint: "Catalogue & matériel", icon: <Icon.Products /> },
  categories: { label: "Catégories", hint: "Arborescence & ordre", icon: <Icon.Categories /> },
  content: { label: "Contenu", hint: "Carrousel & homepage", icon: <Icon.Overview /> },
  orders: { label: "Commandes", hint: "Liste & statuts", icon: <Icon.Orders /> },
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
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [adminOrders, setAdminOrders] = useState<AdminOrderListRow[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", imageUrl: "" });
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

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await authFetch(`${API_URL}/admin/dashboard`);
      if (!res.ok) throw new Error();
      setDashboard((await res.json()) as AdminDashboardData);
    } catch {
      setDashboard(null);
      flash("error", "Impossible de charger les KPI vente.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadAdminOrders = async (page = ordersPage, status = ordersStatusFilter) => {
    setLoadingOrders(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) sp.set("status", status);
      const res = await authFetch(`${API_URL}/admin/orders?${sp.toString()}`);
      if (!res.ok) throw new Error();
      const body = (await res.json()) as {
        data: AdminOrderListRow[];
        meta: { total: number; page: number; totalPages: number };
      };
      setAdminOrders(body.data ?? []);
      setOrdersMeta(body.meta ?? null);
      setOrdersPage(body.meta?.page ?? page);
    } catch {
      flash("error", "Chargement des commandes impossible.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const openOrderDetail = async (id: string) => {
    setOrderDetail(null);
    setLoadingOrderDetail(true);
    try {
      const res = await authFetch(`${API_URL}/admin/orders/${id}`);
      if (!res.ok) throw new Error();
      setOrderDetail((await res.json()) as AdminOrderDetail);
    } catch {
      setOrderDetail(null);
      flash("error", "Détail commande introuvable.");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const patchOrderStatus = async (id: string, status: string) => {
    try {
      const res = await authFetch(`${API_URL}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrderDetail((await res.json()) as AdminOrderDetail);
      await loadAdminOrders(ordersPage, ordersStatusFilter);
      await loadDashboard();
      flash("success", "Statut mis à jour.");
    } catch {
      flash("error", "Mise à jour du statut impossible.");
    }
  };

  useEffect(() => {
    void Promise.all([loadCategories(), loadProducts(), loadUsers(), loadContactMessages(), loadDashboard()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (section !== "orders") return;
    void loadAdminOrders(ordersPage, ordersStatusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, ordersPage, ordersStatusFilter]);

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
      setNewCategory({ name: "", slug: "", description: "", imageUrl: "" });
      await loadCategories();
      flash("success", "Catégorie créée.");
    } catch {
      flash("error", "Erreur création catégorie.");
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      const res = await authFetch(`${API_URL}/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          featured: !p.featured,
          featuredOrder: p.featured ? 0 : products.filter((x) => x.featured).length,
        }),
      });
      if (!res.ok) throw new Error();
      await loadProducts();
      flash("success", p.featured ? "Retiré des vedettes." : "Ajouté aux vedettes.");
    } catch {
      flash("error", "Action échouée.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const res = await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadProducts();
      flash("success", "Produit supprimé.");
    } catch {
      flash("error", "Suppression impossible.");
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
            ? "bg-linear-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20"
            : "text-foreground/70 hover:bg-background hover:text-foreground"
        }`}
      >
        <span className={active ? "text-white" : "text-foreground/50 group-hover:text-primary"}>{meta.icon}</span>
        <span className="flex-1 text-left">{meta.label}</span>
        {key === "messages" && contactMessages.length > 0 && (
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
              active ? "bg-white/25 text-white" : "bg-error/10 text-error"
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

  const orderStatusBadge = (status: string) => {
    const map: Record<string, { tone: "slate" | "sky" | "violet" | "emerald" | "rose"; label: string }> = {
      pending: { tone: "slate", label: "En attente" },
      processing: { tone: "sky", label: "En traitement" },
      shipped: { tone: "violet", label: "Expédiée" },
      delivered: { tone: "emerald", label: "Livrée" },
      cancelled: { tone: "rose", label: "Annulée" },
    };
    const m = map[status] ?? { tone: "slate" as const, label: status };
    return <Badge tone={m.tone}>{m.label}</Badge>;
  };

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
      <div className="bg-linear-to-br from-background via-background to-background/30 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.08),0_2px_4px_-2px_rgb(0,0,0,0.05)]">
              <div className="mb-4 flex items-center gap-3 border-b border-foreground/10 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-hover text-white shadow-md">
                  <Icon.Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">Admin Panel</p>
                  <p className="truncate text-[11px] text-foreground/60">{user?.email ?? "admin"}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {(Object.keys(SECTION_META) as Section[]).map((k) => navItem(k))}
              </nav>
              <div className="mt-4 rounded-xl bg-linear-to-br from-primary/10 to-primary-hover/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Statut système</p>
                <p className="mt-1 flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
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
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
                  <span>Dashboard</span>
                  <span className="text-foreground/40">/</span>
                  <span className="text-primary">{SECTION_META[section].label}</span>
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  {section === "overview" ? `Bonjour ${user?.email?.split("@")[0] ?? "Admin"} 👋` : SECTION_META[section].label}
                </h1>
                <p className="text-xs text-foreground/60 first-letter:capitalize">{today}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    void Promise.all([
                      loadCategories(),
                      loadProducts(),
                      loadUsers(),
                      loadContactMessages(),
                      loadDashboard(),
                      section === "orders" ? loadAdminOrders(ordersPage, ordersStatusFilter) : Promise.resolve(),
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 bg-white px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:border-primary hover:text-primary"
                >
                  <Icon.Refresh />
                  Rafraîchir
                </button>
                <div className="relative">
                  <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-white text-foreground/70 transition hover:border-primary hover:text-primary">
                    <Icon.Bell />
                    {contactMessages.length > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
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
                    ? "border border-success/30 bg-success/10 text-success"
                    : "border border-error/30 bg-error/10 text-error"
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

                {loadingDashboard ? (
                  <p className="text-center text-sm text-foreground/50">Chargement des indicateurs vente…</p>
                ) : dashboard ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      label="CA aujourd&apos;hui"
                      value={`${dashboard.kpi.revenueToday.toFixed(2)} €`}
                      trend={`Hier : ${dashboard.kpi.revenueYesterday.toFixed(2)} €`}
                      hint="Hors commandes annulées"
                      tone="primary"
                      icon={<Icon.TrendUp />}
                    />
                    <StatCard
                      label="Commandes aujourd&apos;hui"
                      value={dashboard.kpi.ordersToday}
                      trend={`Hier : ${dashboard.kpi.ordersYesterday}`}
                      hint="Nombre de commandes créées"
                      tone="sky"
                      icon={<Icon.Orders />}
                    />
                  </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-3">
                  <Panel title="Répartition du catalogue" subtitle="Produits par catégorie" className="lg:col-span-2">
                    {categoryDist.length === 0 ? (
                      <p className="py-8 text-center text-sm text-foreground/50">Pas encore de données.</p>
                    ) : (
                      <div className="space-y-3">
                        {categoryDist.map((d) => (
                          <div key={d.name}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground/80">{d.name}</span>
                              <span className="font-semibold text-foreground/60">{d.count}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-background">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-primary to-primary-hover"
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
                      <div className="flex items-center justify-between rounded-xl bg-error/10 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-error">Rupture</p>
                          <p className="text-2xl font-bold text-error">{outOfStockCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
                          <Icon.X className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-warning/10 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-warning">Stock faible</p>
                          <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                          <Icon.TrendUp className="h-5 w-5" />
                        </div>
                      </div>
                      <button
                        onClick={() => setSection("products")}
                        className="w-full rounded-lg border border-foreground/10 bg-white py-2 text-xs font-semibold text-foreground/70 transition hover:border-primary hover:text-primary"
                      >
                        Voir les produits →
                      </button>
                    </div>
                  </Panel>
                </div>

                {dashboard ? (
                  <Panel title="Graphiques vente" subtitle="7 jours, 5 semaines, statuts, catégories (30 j.)">
                    <DashboardCharts data={dashboard} />
                  </Panel>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel
                    title="Derniers messages"
                    subtitle={`${contactMessages.length} au total`}
                    actions={
                      <button
                        onClick={() => setSection("messages")}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Voir tout
                      </button>
                    }
                  >
                    {recentMessages.length === 0 ? (
                      <p className="py-8 text-center text-sm text-foreground/50">Aucun message pour le moment.</p>
                    ) : (
                      <ul className="-my-2 divide-y divide-foreground/10">
                        {recentMessages.map((m) => (
                          <li key={m.id} className="flex items-start gap-3 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary">
                              {m.email.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">{m.subject}</p>
                                <span className="shrink-0 text-[10px] text-foreground/50">
                                  {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                              <p className="truncate text-xs text-foreground/60">{m.email}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-foreground/70">{m.message}</p>
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
                        className="group flex flex-col items-start gap-2 rounded-xl border border-foreground/10 bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                          <Icon.Plus />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Nouveau produit</p>
                        <p className="text-xs text-foreground/60">Ajouter au catalogue</p>
                      </button>
                      <button
                        onClick={() => setSection("categories")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-foreground/10 bg-white p-4 text-left transition hover:border-primary hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                          <Icon.Categories />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Catégories</p>
                        <p className="text-xs text-foreground/60">Organiser l'arborescence</p>
                      </button>
                      <button
                        onClick={() => setSection("users")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-foreground/10 bg-white p-4 text-left transition hover:border-success hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success transition group-hover:bg-success group-hover:text-white">
                          <Icon.Users />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Utilisateurs</p>
                        <p className="text-xs text-foreground/60">Gérer les comptes</p>
                      </button>
                      <button
                        onClick={() => setSection("messages")}
                        className="group flex flex-col items-start gap-2 rounded-xl border border-foreground/10 bg-white p-4 text-left transition hover:border-warning hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning transition group-hover:bg-warning group-hover:text-white">
                          <Icon.Messages />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Messages</p>
                        <p className="text-xs text-foreground/60">Boîte de réception</p>
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
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Rechercher…"
                          className="w-48 rounded-lg border border-foreground/10 bg-white py-1.5 pl-8 pr-3 text-xs text-foreground/80 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </div>
                      <button
                        onClick={() => setShowProductForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                      >
                        <Icon.Plus /> Ajouter
                      </button>
                    </>
                  }
                >
                  {loadingProducts ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Chargement…</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Aucun produit trouvé.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-foreground/10 text-[11px] uppercase tracking-wider text-foreground/60">
                            <th className="py-2 pr-4 font-semibold">Produit</th>
                            <th className="py-2 pr-4 font-semibold">SKU</th>
                            <th className="py-2 pr-4 font-semibold">Catégorie</th>
                            <th className="py-2 pr-4 font-semibold">Prix</th>
                            <th className="py-2 pr-4 font-semibold">TVA</th>
                            <th className="py-2 pr-4 font-semibold">Stock</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                            <th className="py-2 pr-4 font-semibold">Vedette</th>
                            <th className="py-2 pr-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="transition hover:bg-background">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-[10px] font-bold uppercase text-foreground/60">
                                    {p.thumbnailUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.thumbnailUrl} alt={p.name ?? ""} className="h-full w-full rounded-lg object-cover" />
                                    ) : (
                                      (p.name ?? "?").slice(0, 2)
                                    )}
                                  </div>
                                  <span className="font-medium text-foreground">{p.name ?? "—"}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-mono text-[11px] text-foreground/60">{p.sku ?? "—"}</td>
                              <td className="py-3 pr-4 text-foreground/70">{p.category?.name ?? "—"}</td>
                              <td className="py-3 pr-4 font-semibold text-foreground">
                                {typeof p.price === "number" ? `${p.price.toFixed(2)} €` : "—"}
                              </td>
                              <td className="py-3 pr-4 text-xs text-foreground/70">
                                {p.vatRate !== undefined && p.vatRate !== null ? `${p.vatRate} %` : "20 %"}
                              </td>
                              <td className="py-3 pr-4 text-foreground/80">{p.stock ?? 0}</td>
                              <td className="py-3 pr-4">{productStatusBadge(p)}</td>
                              <td className="py-3 pr-4">
                                <label className="inline-flex cursor-pointer items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!p.featured}
                                    onChange={() => toggleFeatured(p)}
                                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary"
                                    aria-label={p.featured ? "Retirer des vedettes" : "Mettre en vedette"}
                                  />
                                  {p.featured ? (
                                    <Badge tone="violet">★ #{(p.featuredOrder ?? 0) + 1}</Badge>
                                  ) : (
                                    <span className="text-xs text-foreground/50">—</span>
                                  )}
                                </label>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="flex justify-end gap-1">
                                  <IconButton tone="rose" onClick={() => deleteProduct(p.id)} title="Supprimer">
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

            {/* CATEGORIES */}
            {section === "categories" && (
              <>
                <Panel title="Créer une catégorie" subtitle="Ajouter à l'arborescence">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nom"
                      className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <input
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="slug-url"
                      className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <input
                      value={newCategory.imageUrl}
                      onChange={(e) => setNewCategory((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="URL de l'image (bannière)"
                      className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={createCategory}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
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
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                        <input
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Filtrer…"
                          className="w-44 rounded-lg border border-foreground/10 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </div>
                      {selectedCategoryIds.length > 0 && (
                        <>
                          <span className="text-xs font-medium text-foreground/60">
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
                    <p className="py-8 text-center text-sm text-foreground/50">Aucune catégorie.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-foreground/10 text-[11px] uppercase tracking-wider text-foreground/60">
                            <th className="w-10 py-2"></th>
                            <th className="py-2 pr-4 font-semibold">Ordre</th>
                            <th className="py-2 pr-4 font-semibold">Nom</th>
                            <th className="py-2 pr-4 font-semibold">Slug</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                            <th className="py-2 pr-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                          {filteredCategories.map((cat) => (
                            <tr key={cat.id} className="transition hover:bg-background">
                              <td className="py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(cat.id)}
                                  onChange={(e) =>
                                    setSelectedCategoryIds((prev) =>
                                      e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="py-3 pr-4 text-xs font-mono text-foreground/60">#{cat.order}</td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  {cat.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={cat.imageUrl}
                                      alt=""
                                      className="h-10 w-14 shrink-0 rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-semibold text-foreground/50">
                                      —
                                    </div>
                                  )}
                                  <span className="font-medium text-foreground">{cat.name}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-mono text-[11px] text-foreground/60">{cat.slug}</td>
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
                                  <IconButton
                                    onClick={() => {
                                      const next = prompt("URL de l'image (vide pour retirer)", cat.imageUrl ?? "");
                                      if (next === null) return;
                                      void updateCategory(cat.id, { imageUrl: next.trim() || undefined });
                                    }}
                                    title="Changer l'image"
                                  >
                                    <Icon.Edit /> Image
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

            {/* CONTENT */}
            {section === "content" && <ContentManager flash={flash} />}

            {section === "orders" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
                <Panel
                  title="Commandes"
                  subtitle={ordersMeta ? `${ordersMeta.total} commande(s)` : ""}
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={ordersStatusFilter}
                        onChange={(e) => {
                          setOrdersStatusFilter(e.target.value);
                          setOrdersPage(1);
                        }}
                        className="rounded-lg border border-foreground/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="">Tous statuts</option>
                        <option value="pending">En attente</option>
                        <option value="processing">En traitement</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  }
                >
                  {loadingOrders ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Chargement…</p>
                  ) : adminOrders.length === 0 ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Aucune commande.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-foreground/10 text-[11px] uppercase tracking-wider text-foreground/60">
                            <th className="py-2 pr-3 font-semibold">Date</th>
                            <th className="py-2 pr-3 font-semibold">Client</th>
                            <th className="py-2 pr-3 font-semibold">Statut</th>
                            <th className="py-2 pr-3 font-semibold">Total</th>
                            <th className="py-2 pr-3 font-semibold">Lignes</th>
                            <th className="py-2 text-right font-semibold">Voir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                          {adminOrders.map((o) => (
                            <tr key={o.id} className="transition hover:bg-background">
                              <td className="py-2.5 pr-3 text-xs text-foreground/70">
                                {new Date(o.createdAt).toLocaleString("fr-FR")}
                              </td>
                              <td className="max-w-[10rem] truncate py-2.5 pr-3 text-xs text-foreground">
                                {o.customerEmail ?? o.userId.slice(0, 8) + "…"}
                              </td>
                              <td className="py-2.5 pr-3">{orderStatusBadge(o.status)}</td>
                              <td className="py-2.5 pr-3 font-semibold text-foreground">
                                {o.total.toFixed(2)} {o.currency}
                              </td>
                              <td className="py-2.5 pr-3 text-xs text-foreground/60">{o.lineCount}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => void openOrderDetail(o.id)}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Détail
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {ordersMeta && ordersMeta.totalPages > 1 ? (
                    <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3 text-xs">
                      <span className="text-foreground/60">
                        Page {ordersMeta.page} / {ordersMeta.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={ordersPage <= 1}
                          onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                          className="rounded-lg border border-foreground/10 px-3 py-1 font-semibold text-foreground/80 disabled:opacity-40"
                        >
                          Précédent
                        </button>
                        <button
                          type="button"
                          disabled={ordersPage >= ordersMeta.totalPages}
                          onClick={() => setOrdersPage((p) => p + 1)}
                          className="rounded-lg border border-foreground/10 px-3 py-1 font-semibold text-foreground/80 disabled:opacity-40"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  ) : null}
                </Panel>

                <div className="space-y-4">
                  <Panel title="Détail commande" subtitle="Lignes, historique de statut">
                    {loadingOrderDetail ? (
                      <p className="text-center text-sm text-foreground/50">Chargement…</p>
                    ) : !orderDetail ? (
                      <p className="text-center text-sm text-foreground/50">
                        Sélectionnez une commande pour afficher le détail.
                      </p>
                    ) : (
                      <div className="space-y-4 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs text-foreground/60">{orderDetail.id}</p>
                          {orderStatusBadge(orderDetail.status)}
                        </div>
                        <p className="text-lg font-bold text-foreground">
                          {orderDetail.total.toFixed(2)} {orderDetail.currency}
                        </p>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-foreground/60">Changer le statut</p>
                          <div className="flex flex-wrap gap-2">
                            {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={orderDetail.status === st}
                                onClick={() => void patchOrderStatus(orderDetail.id, st)}
                                className="rounded-lg border border-foreground/10 px-2 py-1 text-xs font-semibold text-foreground/80 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-foreground/60">Historique</p>
                          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-foreground/70">
                            {(orderDetail.statusHistory ?? []).map((h, i) => (
                              <li key={`${h.at}-${i}`} className="flex justify-between gap-2 border-b border-foreground/10 py-1">
                                <span>{orderStatusBadge(h.status)}</span>
                                <span className="shrink-0 text-foreground/50">
                                  {new Date(h.at).toLocaleString("fr-FR")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-foreground/60">Lignes</p>
                          <ul className="space-y-2 text-xs">
                            {orderDetail.items.map((it) => (
                              <li key={it.id} className="flex justify-between gap-2 rounded-lg bg-background px-2 py-2">
                                <span className="min-w-0 truncate font-medium text-foreground">{it.productName}</span>
                                <span className="shrink-0 font-mono text-foreground/60">
                                  ×{it.quantity} · {(it.price * it.quantity).toFixed(2)} €
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
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
                        <Icon.Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
                          placeholder="Rechercher un email…"
                          className="w-60 rounded-lg border border-foreground/10 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </div>
                      <button
                        onClick={() => loadUsers(search)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                      >
                        Rechercher
                      </button>
                    </>
                  }
                >
                  {loadingUsers ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Chargement…</p>
                  ) : users.length === 0 ? (
                    <p className="py-8 text-center text-sm text-foreground/50">Aucun utilisateur.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-foreground/10 text-[11px] uppercase tracking-wider text-foreground/60">
                            <th className="py-2 pr-4 font-semibold">Utilisateur</th>
                            <th className="py-2 pr-4 font-semibold">Rôle</th>
                            <th className="py-2 pr-4 font-semibold">Statut</th>
                            <th className="py-2 pr-4 font-semibold">Dernière connexion</th>
                            <th className="py-2 pr-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                          {users.map((u) => (
                            <tr key={u.id} className="transition hover:bg-background">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary-hover/10 text-[11px] font-bold uppercase text-primary">
                                    {u.email.slice(0, 2)}
                                  </div>
                                  <span className="font-medium text-foreground">{u.email}</span>
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
                              <td className="py-3 pr-4 text-xs text-foreground/60">
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    <Icon.Refresh /> Rafraîchir
                  </button>
                }
              >
                {loadingMessages ? (
                  <p className="py-8 text-center text-sm text-foreground/50">Chargement…</p>
                ) : contactMessages.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-foreground/50">
                      <Icon.Messages className="h-7 w-7" />
                    </div>
                    <p className="text-sm text-foreground/60">Aucun message pour le moment.</p>
                  </div>
                ) : (
                  <ul className="-my-3 divide-y divide-foreground/10">
                    {contactMessages
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((msg) => (
                        <li key={msg.id} className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
                              {msg.email.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{msg.subject}</p>
                                <span className="text-[11px] text-foreground/50">
                                  {new Date(msg.createdAt).toLocaleString("fr-FR")}
                                </span>
                              </div>
                              <a
                                href={`mailto:${msg.email}`}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {msg.email}
                              </a>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{msg.message}</p>
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
