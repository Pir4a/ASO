"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./backoffice.css";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { ProductForm } from "@/components/backoffice/ProductForm";
import { ContentManager } from "@/components/backoffice/ContentManager";
import { DashboardCharts, type AdminDashboardData } from "@/components/backoffice/DashboardCharts";
import {
  BarChart,
  Donut,
  Icon,
  IconButton,
  KpiCard,
  Panel,
} from "@/components/backoffice/DashboardUI";
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
  slug?: string;
  description?: string;
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
  listPriority?: number;
  galleryUrls?: string[];
  specs?: Record<string, string>;
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

type Section =
  | "overview"
  | "analytics"
  | "products"
  | "categories"
  | "content"
  | "orders"
  | "users"
  | "messages"
  | "settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const SECTION_LABEL: Record<Section, string> = {
  overview: "Overview",
  analytics: "Analytique",
  products: "Produits",
  categories: "Catégories",
  content: "Contenu",
  orders: "Commandes",
  users: "Utilisateurs",
  messages: "Messages",
  settings: "Paramètres",
};

function BackofficeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", imageUrl: "" });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

  const refreshAll = () =>
    Promise.all([
      loadCategories(),
      loadProducts(),
      loadUsers(),
      loadContactMessages(),
      loadDashboard(),
      section === "orders" ? loadAdminOrders(ordersPage, ordersStatusFilter) : Promise.resolve(),
    ]);

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  /* ------------------------------- Derived -------------------------------- */

  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;
  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingProductId) ?? null,
    [products, editingProductId],
  );

  const filteredProducts = products.filter(
    (p) =>
      (p.name ?? "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(productSearch.toLowerCase()),
  );

  const filteredCategories = [...categories]
    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  const categoryProductCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const cid = p.category?.id ?? p.categoryId;
      if (!cid) continue;
      map.set(cid, (map.get(cid) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const selectedCategoryProducts = useMemo(() => {
    if (!selectedCategoryId) return [] as Product[];
    return products
      .filter((p) => (p.category?.id ?? p.categoryId) === selectedCategoryId)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [products, selectedCategoryId]);

  const recentMessages = [...contactMessages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const categoryDist = useMemo(
    () =>
      categories
        .map((c) => ({
          name: c.name,
          count: products.filter((p) => p.category?.id === c.id || p.categoryId === c.id).length,
        }))
        .sort((a, b) => b.count - a.count),
    [categories, products],
  );
  const catalogTotal = categoryDist.reduce((s, c) => s + c.count, 0);

  const stockAlerts = useMemo(
    () =>
      products
        .filter((p) => (p.stock ?? 0) < 5)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        .slice(0, 5),
    [products],
  );

  const recentOrdersPreview = useMemo(() => {
    const src = adminOrders.length > 0 ? adminOrders : [];
    return src.slice(0, 5);
  }, [adminOrders]);

  const counts = {
    products: products.length,
    categories: categories.length,
    orders: ordersMeta?.total ?? adminOrders.length,
    users: users.length,
    messages: contactMessages.length,
  };

  const sparkSeed = (key: string) => {
    let s = 0;
    for (let i = 0; i < key.length; i++) s = (s * 31 + key.charCodeAt(i)) >>> 0;
    return Array.from({ length: 12 }, () => {
      s = (s * 9301 + 49297) % 233280;
      return Math.round((s / 233280) * 8) + 4;
    });
  };

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* ------------------------------- Sidebar -------------------------------- */

  const sidebarSections: { label: string; items: { id: Section; name: string; icon: keyof typeof Icon; count?: number; dot?: boolean }[] }[] = [
    {
      label: "Tableau de bord",
      items: [
        { id: "overview", name: "Overview", icon: "Overview" },
        { id: "analytics", name: "Analytique", icon: "Flag" },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { id: "products", name: "Produits", icon: "Products", count: counts.products },
        { id: "categories", name: "Catégories", icon: "Categories", count: counts.categories },
        { id: "content", name: "Contenu", icon: "Doc" },
      ],
    },
    {
      label: "Opérations",
      items: [
        { id: "orders", name: "Commandes", icon: "Orders", count: counts.orders },
        { id: "users", name: "Utilisateurs", icon: "Users", count: counts.users },
        { id: "messages", name: "Messages", icon: "Messages", dot: counts.messages > 0 },
      ],
    },
    {
      label: "Système",
      items: [{ id: "settings", name: "Paramètres", icon: "Settings" }],
    },
  ];

  const orderStatusBadge = (status: string) => {
    const map: Record<string, { tone: "ok" | "warn" | "neutral" | "danger" | "brand"; label: string }> = {
      pending: { tone: "warn", label: "En attente" },
      processing: { tone: "brand", label: "En traitement" },
      shipped: { tone: "neutral", label: "Expédiée" },
      delivered: { tone: "ok", label: "Livrée" },
      cancelled: { tone: "danger", label: "Annulée" },
    };
    const m = map[status] ?? { tone: "neutral" as const, label: status };
    return <span className={`bo-badge ${m.tone}`}>{m.label}</span>;
  };

  const productStatusBadge = (p: Product) => {
    const stock = p.stock ?? 0;
    if (stock === 0) return <span className="bo-badge danger">Rupture</span>;
    if (stock < 5) return <span className="bo-badge warn">Stock faible</span>;
    if (p.status === "new") return <span className="bo-badge brand">Nouveau</span>;
    return <span className="bo-badge ok">En stock</span>;
  };

  const initials = (s: string) =>
    s
      .replace(/[^A-Za-z0-9 ]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  /* --------------------------------- UI ----------------------------------- */

  return (
    <div className="bo-root">
      <div className="bo-app">
        {/* Brand corner */}
        <div className="bo-brand-cell">
          <div className="bo-brand-mark">A+</div>
          <div className="bo-brand-name">Althea Systems</div>
          <div className="bo-brand-env">PROD</div>
        </div>

        {/* Top bar */}
        <header className="bo-topbar">
          <div className="bo-crumbs">
            <span>Dashboard</span>
            <span className="sep">/</span>
            <span className="current">{SECTION_LABEL[section]}</span>
          </div>
          <div className="bo-top-spacer" />
          <div className="bo-search">
            <Icon.Search />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Rechercher produits, commandes, clients…"
            />
            <kbd>⌘K</kbd>
          </div>
          <Link href="/" className="bo-btn" title="Retour au site">
            <Icon.Home /> Retour au site
          </Link>
          <button className="bo-icon-btn" title="Notifications" type="button">
            <Icon.Bell />
          </button>
          <button className="bo-icon-btn" title="Paramètres" type="button" onClick={() => setSection("settings")}>
            <Icon.Settings />
          </button>
          <div className="bo-divider-v" />
          <div className="bo-user-chip" title={user?.email ?? "admin"}>
            <span className="avatar">{(user?.email ?? "A")[0].toUpperCase()}</span>
            <div>
              <div style={{ fontWeight: 500, lineHeight: 1.1 }}>{user?.email?.split("@")[0] ?? "admin"}</div>
              <div style={{ fontSize: 10, color: "var(--bo-text-dim)", lineHeight: 1.1 }}>
                {user?.email ?? "admin@althea.local"}
              </div>
            </div>
            <span className="role">Admin</span>
            <Icon.ChevD />
          </div>
          <button className="bo-icon-btn danger" title="Déconnexion" type="button" onClick={handleLogout}>
            <Icon.Logout />
          </button>
        </header>

        {/* Sidebar */}
        <aside className="bo-sidebar">
          {sidebarSections.map((sec) => (
            <div className="bo-side-section" key={sec.label}>
              <div className="bo-side-label">{sec.label}</div>
              {sec.items.map((it) => {
                const IcoCmp = Icon[it.icon];
                const active = section === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSection(it.id)}
                    className={`bo-nav-item ${active ? "active" : ""}`}
                  >
                    <IcoCmp className="ico" />
                    <span>{it.name}</span>
                    {typeof it.count === "number" && <span className="count bo-num">{it.count}</span>}
                    {it.dot && <span className="dot" />}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="bo-side-footer">
            <div className="bo-status-row">
              <span className="bo-status-dot" />
              <span>Tous les services actifs</span>
            </div>
            <div className="bo-status-row bo-dim bo-mono" style={{ fontSize: 10 }}>
              api · db · cdn · queue
            </div>
            <div
              className="bo-status-row bo-dim"
              style={{ fontSize: 10, justifyContent: "space-between" }}
            >
              <span>v2.14.3</span>
              <span className="bo-mono">build a7f9e2</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="bo-main">
          {/* Page head */}
          <div className="bo-page-head">
            <div>
              <h1 className="bo-page-title">
                {section === "overview"
                  ? `Bonjour ${user?.email?.split("@")[0] ?? "admin"}`
                  : SECTION_LABEL[section]}
                <span className="bo-page-pill">PROD</span>
              </h1>
              <div className="bo-page-sub" style={{ textTransform: "lowercase" }}>
                <span style={{ textTransform: "capitalize" }}>{today}</span>
                {" · Dernière synchro à l'instant"}
              </div>
            </div>
            <div className="bo-head-actions">
              <button className="bo-btn" type="button" onClick={() => void refreshAll()}>
                <Icon.Refresh /> Rafraîchir
              </button>
              {section === "products" && (
                <button
                  className="bo-btn primary"
                  type="button"
                  onClick={() => setShowProductForm((v) => !v)}
                >
                  <Icon.Plus /> Nouveau produit
                </button>
              )}
            </div>
          </div>

          {/* Flash banner */}
          {feedback && (
            <div className={`bo-flash ${feedback.kind}`}>
              {feedback.kind === "success" ? <Icon.Check /> : <Icon.X />}
              {feedback.text}
            </div>
          )}

          {/* OVERVIEW */}
          {section === "overview" && (
            <>
              <div className="bo-grid bo-kpi-row">
                <KpiCard
                  label="Produits"
                  value={products.length}
                  hint={`${outOfStockCount} en rupture · ${products.length - outOfStockCount} dispo`}
                  delta={
                    outOfStockCount > 0
                      ? { dir: "down", txt: `${outOfStockCount} rupture` }
                      : { dir: "flat", txt: "stable" }
                  }
                  spark={sparkSeed("p" + products.length)}
                />
                <KpiCard
                  label="Catégories"
                  value={categories.length}
                  hint={`${activeCategories} active${activeCategories > 1 ? "s" : ""}`}
                  delta={{ dir: "flat", txt: "stable" }}
                  spark={sparkSeed("c" + categories.length)}
                />
                <KpiCard
                  label="Utilisateurs"
                  value={users.length}
                  hint={`${adminCount} admin${adminCount > 1 ? "s" : ""} · ${users.length - adminCount} clients`}
                  delta={{ dir: "up", txt: `${activeUsers} actifs` }}
                  spark={sparkSeed("u" + users.length)}
                />
                <KpiCard
                  label="Messages"
                  value={contactMessages.length}
                  hint={contactMessages.length === 0 ? "0 non lus" : `${contactMessages.length} non lus`}
                  delta={
                    contactMessages.length > 0
                      ? { dir: "up", txt: "+" + contactMessages.length }
                      : { dir: "flat", txt: "—" }
                  }
                  spark={sparkSeed("m" + contactMessages.length)}
                />
              </div>

              {dashboard && (
                <div
                  className="bo-grid bo-kpi-row"
                  style={{ gridTemplateColumns: "1.3fr 1.3fr 1fr 1fr" }}
                >
                  <KpiCard
                    label="CA aujourd'hui"
                    value={dashboard.kpi.revenueToday.toFixed(2).replace(".", ",")}
                    unit="EUR"
                    hint={`Hier · ${dashboard.kpi.revenueYesterday.toFixed(2).replace(".", ",")} EUR`}
                    hintRight="Hors annulées"
                    delta={
                      dashboard.kpi.revenueToday >= dashboard.kpi.revenueYesterday
                        ? { dir: "up", txt: "↑" }
                        : { dir: "down", txt: "↓" }
                    }
                    spark={sparkSeed("rev" + dashboard.kpi.revenueToday)}
                  />
                  <KpiCard
                    label="Commandes aujourd'hui"
                    value={dashboard.kpi.ordersToday}
                    hint={`Hier · ${dashboard.kpi.ordersYesterday}`}
                    hintRight="Toutes origines"
                    delta={
                      dashboard.kpi.ordersToday >= dashboard.kpi.ordersYesterday
                        ? { dir: "up", txt: `+${dashboard.kpi.ordersToday - dashboard.kpi.ordersYesterday}` }
                        : { dir: "down", txt: `${dashboard.kpi.ordersToday - dashboard.kpi.ordersYesterday}` }
                    }
                    spark={sparkSeed("ord" + dashboard.kpi.ordersToday)}
                  />
                  <KpiCard
                    label="Taux conv."
                    value="2,4"
                    unit="%"
                    hint="visites → commandes"
                    spark={[1.8, 2.1, 2.0, 2.3, 2.2, 2.4, 2.4]}
                  />
                  <KpiCard
                    label="Panier moyen"
                    value={
                      dashboard.kpi.ordersToday > 0
                        ? Math.round(dashboard.kpi.revenueToday / Math.max(1, dashboard.kpi.ordersToday)).toString()
                        : "—"
                    }
                    unit="EUR"
                    hint="30 derniers jours"
                    spark={[380, 395, 402, 398, 410, 408, 412]}
                  />
                </div>
              )}

              {/* Catalog distribution + stock alerts */}
              <div className="bo-grid bo-col-row">
                <div className="bo-card">
                  <div className="bo-card-head">
                    <div>
                      <div className="bo-card-title">Répartition du catalogue</div>
                      <div className="bo-card-sub">
                        {catalogTotal} produit{catalogTotal > 1 ? "s" : ""} · {activeCategories} catégorie
                        {activeCategories > 1 ? "s" : ""} active{activeCategories > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="bo-card-actions">
                      <div className="bo-tab-row">
                        <button className="bo-tab active" type="button">
                          Nombre
                        </button>
                        <button className="bo-tab" type="button" disabled>
                          CA
                        </button>
                        <button className="bo-tab" type="button" disabled>
                          Stock
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    {categoryDist.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center" }} className="bo-muted">
                        Pas encore de données.
                      </div>
                    ) : (
                      categoryDist.map((c) => {
                        const pct = catalogTotal === 0 ? 0 : Math.round((c.count / catalogTotal) * 100);
                        return (
                          <div className="bo-dist-row" key={c.name}>
                            <div className="bo-dist-name">{c.name}</div>
                            <div className="bo-dist-bar-wrap">
                              <div className="bo-dist-bar" style={{ width: pct + "%" }} />
                            </div>
                            <div className="bo-dist-count bo-num">{c.count}</div>
                            <div className="bo-dist-pct bo-num">{pct}%</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bo-card">
                  <div className="bo-card-head">
                    <div>
                      <div className="bo-card-title">Alertes stock</div>
                      <div className="bo-card-sub">
                        {outOfStockCount} en rupture · {lowStockCount} faible{lowStockCount > 1 ? "s" : ""}
                      </div>
                    </div>
                    <button className="bo-btn" type="button" onClick={() => setSection("products")}>
                      Voir tout <Icon.ChevR />
                    </button>
                  </div>
                  <div>
                    {stockAlerts.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center" }} className="bo-muted">
                        Aucune alerte stock.
                      </div>
                    ) : (
                      stockAlerts.map((a) => (
                        <div className="bo-alert-row" key={a.id}>
                          <div>
                            <div className="bo-alert-name">{a.name ?? "—"}</div>
                            <span className="bo-alert-sku">{a.sku ?? "—"}</span>
                          </div>
                          <div className="bo-alert-stock">{a.stock ?? 0} / 10</div>
                          {(a.stock ?? 0) === 0 ? (
                            <span className="bo-badge danger">
                              <Icon.Warn /> Rupture
                            </span>
                          ) : (
                            <span className="bo-badge warn">
                              <Icon.Warn /> Faible
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sales chart + status donut */}
              {dashboard && (
                <div className="bo-grid bo-sales-row">
                  <div className="bo-card">
                    <div className="bo-card-head">
                      <div>
                        <div className="bo-card-title">Commandes — 7 derniers jours</div>
                        <div className="bo-card-sub">Volume quotidien · fuseau Europe/Paris</div>
                      </div>
                    </div>
                    <div className="bo-chart-legend">
                      <div className="bo-lg-item">
                        <span className="bo-lg-sw" style={{ background: "var(--bo-brand)" }} /> Commandes créées
                      </div>
                    </div>
                    <div className="bo-chart-area">
                      <BarChart
                        data={dashboard.salesByDay.map((d) => d.orders)}
                        labels={dashboard.salesByDay.map((d) => d.date.slice(8))}
                        color="var(--bo-brand)"
                      />
                    </div>
                  </div>

                  <div className="bo-card">
                    <div className="bo-card-head">
                      <div>
                        <div className="bo-card-title">Statuts des commandes</div>
                        <div className="bo-card-sub">7 derniers jours</div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "180px 1fr",
                        gap: 10,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "grid", placeItems: "center" }}>
                        <Donut
                          centerLabel="COMMANDES"
                          segments={dashboard.statusMix7d.map((s) => ({
                            label: s.status,
                            value: s.count,
                            color:
                              s.status === "delivered"
                                ? "var(--bo-ok)"
                                : s.status === "pending"
                                ? "var(--bo-warn)"
                                : s.status === "cancelled"
                                ? "var(--bo-danger)"
                                : "var(--bo-brand)",
                          }))}
                        />
                      </div>
                      <div className="bo-vstack" style={{ gap: 2 }}>
                        {dashboard.statusMix7d.map((s) => {
                          const total = dashboard.statusMix7d.reduce((a, b) => a + b.count, 0) || 1;
                          const pct = Math.round((s.count / total) * 100);
                          const swatch =
                            s.status === "delivered"
                              ? "var(--bo-ok)"
                              : s.status === "pending"
                              ? "var(--bo-warn)"
                              : s.status === "cancelled"
                              ? "var(--bo-danger)"
                              : "var(--bo-brand)";
                          return (
                            <div
                              key={s.status}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "12px 1fr auto auto",
                                gap: 8,
                                alignItems: "center",
                                padding: "5px 2px",
                                borderTop: "1px solid var(--bo-border)",
                              }}
                            >
                              <span style={{ width: 10, height: 10, background: swatch, borderRadius: 2 }} />
                              <span style={{ textTransform: "capitalize" }}>{s.status}</span>
                              <span className="bo-num" style={{ fontWeight: 600 }}>
                                {s.count}
                              </span>
                              <span className="bo-num bo-dim" style={{ fontSize: 11, width: 32, textAlign: "right" }}>
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent orders + recent messages */}
              <div className="bo-grid bo-col-row">
                <div className="bo-card">
                  <div className="bo-card-head">
                    <div>
                      <div className="bo-card-title">Commandes récentes</div>
                      <div className="bo-card-sub">
                        {recentOrdersPreview.length} dernière{recentOrdersPreview.length > 1 ? "s" : ""} · triées par date
                      </div>
                    </div>
                    <button className="bo-btn" type="button" onClick={() => setSection("orders")}>
                      Toutes les commandes <Icon.ChevR />
                    </button>
                  </div>
                  {recentOrdersPreview.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center" }} className="bo-muted">
                      Aucune commande.
                    </div>
                  ) : (
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th>Référence</th>
                          <th>Client</th>
                          <th>Statut</th>
                          <th className="num">Montant</th>
                          <th>Reçue</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrdersPreview.map((o) => {
                          const cust = o.customerEmail ?? o.userId.slice(0, 8) + "…";
                          return (
                            <tr key={o.id}>
                              <td className="bo-mono" style={{ fontSize: 11.5 }}>
                                {o.id.slice(0, 14)}
                              </td>
                              <td>
                                <span
                                  className="bo-avatar-sm"
                                  style={{
                                    background: `oklch(0.65 0.12 ${(cust.charCodeAt(0) * 3) % 360})`,
                                  }}
                                >
                                  {initials(cust)}
                                </span>
                                {cust}
                              </td>
                              <td>{orderStatusBadge(o.status)}</td>
                              <td className="num" style={{ fontWeight: 600 }}>
                                {o.total.toFixed(2)} {o.currency}
                              </td>
                              <td className="muted">{new Date(o.createdAt).toLocaleString("fr-FR")}</td>
                              <td className="num">
                                <button
                                  className="bo-icon-btn"
                                  style={{ width: 22, height: 22 }}
                                  type="button"
                                  onClick={() => {
                                    setSection("orders");
                                    void openOrderDetail(o.id);
                                  }}
                                >
                                  <Icon.ChevR />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="bo-card">
                  <div className="bo-card-head">
                    <div>
                      <div className="bo-card-title">Derniers messages</div>
                      <div className="bo-card-sub">{contactMessages.length} au total</div>
                    </div>
                    <button className="bo-btn" type="button" onClick={() => setSection("messages")}>
                      Voir tout <Icon.ChevR />
                    </button>
                  </div>
                  <div>
                    {recentMessages.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center" }} className="bo-muted">
                        Aucun message pour le moment.
                      </div>
                    ) : (
                      recentMessages.map((m) => (
                        <div className="bo-feed-row" key={m.id}>
                          <div className="bo-feed-time">
                            {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="bo-feed-main">
                            <span className="bo-feed-tag update">contact</span>
                            <span className="bo-mono" style={{ fontSize: 11.5, color: "var(--bo-text-muted)" }}>
                              {m.email}
                            </span>
                            <span style={{ fontWeight: 500 }}>{m.subject}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="bo-statusbar">
                <div className="bo-hstack">
                  <span className="dot" /> operational
                </div>
                <span>env: prod</span>
                <span>region: eu-west-3</span>
                <span>api: 42 ms</span>
                <span>db: 11 ms</span>
                <span style={{ marginLeft: "auto" }}>© Althea Systems</span>
              </div>
            </>
          )}

          {/* ANALYTICS */}
          {section === "analytics" && (
            <Panel title="Analytique" subtitle="Graphiques détaillés (7 jours, 5 semaines, statuts, catégories)">
              {loadingDashboard ? (
                <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                  Chargement…
                </p>
              ) : dashboard ? (
                <DashboardCharts data={dashboard} />
              ) : (
                <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                  Pas de données à afficher.
                </p>
              )}
            </Panel>
          )}

          {/* PRODUCTS */}
          {section === "products" && (
            <>
              <div className="bo-grid bo-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <KpiCard label="Total" value={products.length} hint="catalogue complet" />
                <KpiCard
                  label="Stock faible"
                  value={lowStockCount}
                  hint="< 5 unités"
                  delta={lowStockCount > 0 ? { dir: "down", txt: "à surveiller" } : { dir: "flat", txt: "—" }}
                />
                <KpiCard
                  label="En rupture"
                  value={outOfStockCount}
                  hint="0 unité disponible"
                  delta={outOfStockCount > 0 ? { dir: "down", txt: "urgent" } : { dir: "flat", txt: "—" }}
                />
              </div>

              {showProductForm && (
                <Panel
                  title={editingProduct ? "Modifier un produit" : "Ajouter un produit"}
                  subtitle={
                    editingProduct
                      ? "Mettre à jour les informations du produit"
                      : "Nouveau matériel médical"
                  }
                  actions={
                    <button
                      className="bo-btn"
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProductId(null);
                      }}
                    >
                      <Icon.X /> Fermer
                    </button>
                  }
                >
                  <ProductForm
                    categories={categories}
                    product={editingProduct}
                    onSaved={() => {
                      void loadProducts();
                      setShowProductForm(false);
                      setEditingProductId(null);
                      flash("success", editingProduct ? "Produit modifié." : "Produit ajouté.");
                    }}
                  />
                </Panel>
              )}

              <Panel
                title="Catalogue"
                subtitle={`${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""}`}
                actions={
                  <>
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Rechercher…"
                      className="bo-input compact"
                      style={{ width: 200 }}
                    />
                    <button
                      className="bo-btn primary"
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setShowProductForm((v) => !v);
                      }}
                    >
                      <Icon.Plus /> Ajouter
                    </button>
                  </>
                }
              >
                {loadingProducts ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Chargement…
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Aucun produit trouvé.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>SKU</th>
                          <th>Catégorie</th>
                          <th className="num">Prix</th>
                          <th className="num">TVA</th>
                          <th className="num">Stock</th>
                          <th>Statut</th>
                          <th>Vedette</th>
                          <th className="num">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="bo-hstack">
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 4,
                                    background: "var(--bo-panel-2)",
                                    border: "1px solid var(--bo-border)",
                                    display: "grid",
                                    placeItems: "center",
                                    overflow: "hidden",
                                    fontSize: 10,
                                    color: "var(--bo-text-muted)",
                                  }}
                                >
                                  {p.thumbnailUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={p.thumbnailUrl}
                                      alt=""
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  ) : (
                                    initials(p.name ?? "?")
                                  )}
                                </div>
                                <span style={{ fontWeight: 500 }}>{p.name ?? "—"}</span>
                              </div>
                            </td>
                            <td className="bo-mono" style={{ fontSize: 11 }}>
                              {p.sku ?? "—"}
                            </td>
                            <td className="muted">{p.category?.name ?? "—"}</td>
                            <td className="num" style={{ fontWeight: 600 }}>
                              {typeof p.price === "number" ? `${p.price.toFixed(2)} €` : "—"}
                            </td>
                            <td className="num muted">
                              {p.vatRate !== undefined && p.vatRate !== null ? `${p.vatRate} %` : "20 %"}
                            </td>
                            <td className="num">{p.stock ?? 0}</td>
                            <td>{productStatusBadge(p)}</td>
                            <td>
                              <label className="bo-hstack" style={{ cursor: "pointer", gap: 6 }}>
                                <input
                                  type="checkbox"
                                  checked={!!p.featured}
                                  onChange={() => toggleFeatured(p)}
                                  aria-label={p.featured ? "Retirer des vedettes" : "Mettre en vedette"}
                                />
                                {p.featured ? (
                                  <span className="bo-badge brand">★ #{(p.featuredOrder ?? 0) + 1}</span>
                                ) : (
                                  <span className="bo-dim">—</span>
                                )}
                              </label>
                            </td>
                            <td className="num">
                              <IconButton
                                tone="primary"
                                onClick={() => {
                                  setEditingProductId(p.id);
                                  setShowProductForm(true);
                                }}
                                title="Modifier"
                              >
                                <Icon.Edit />
                              </IconButton>
                              <IconButton tone="rose" onClick={() => deleteProduct(p.id)} title="Supprimer">
                                <Icon.Trash />
                              </IconButton>
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
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  }}
                >
                  <div>
                    <div className="bo-label">Nom</div>
                    <input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Imaging & Diagnostics"
                      className="bo-input"
                    />
                  </div>
                  <div>
                    <div className="bo-label">Slug</div>
                    <input
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
                      placeholder="imaging-diagnostics"
                      className="bo-input bo-mono"
                    />
                  </div>
                  <div>
                    <div className="bo-label">Description</div>
                    <input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description courte"
                      className="bo-input"
                    />
                  </div>
                  <div>
                    <div className="bo-label">Image (URL)</div>
                    <input
                      value={newCategory.imageUrl}
                      onChange={(e) => setNewCategory((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="https://…/image.jpg"
                      className="bo-input"
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <button className="bo-btn primary" type="button" onClick={createCategory}>
                    <Icon.Plus /> Créer
                  </button>
                </div>
              </Panel>

              <div className="bo-grid bo-col-row" style={{ gridTemplateColumns: "1fr minmax(0, 22rem)" }}>
                <Panel
                  title="Gestion des catégories"
                  subtitle={`${filteredCategories.length} catégorie${filteredCategories.length > 1 ? "s" : ""} · ${activeCategories} active${activeCategories > 1 ? "s" : ""}`}
                  actions={
                    <>
                      <input
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Filtrer…"
                        className="bo-input compact"
                        style={{ width: 180 }}
                      />
                      {selectedCategoryIds.length > 0 && (
                        <>
                          <span className="bo-muted" style={{ fontSize: 11 }}>
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
                    <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                      Aucune catégorie.
                    </p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="bo-data">
                        <thead>
                          <tr>
                            <th style={{ width: 32 }}></th>
                            <th>Ordre</th>
                            <th>Nom</th>
                            <th>Slug</th>
                            <th>Statut</th>
                            <th className="num">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCategories.map((cat) => (
                            <tr
                              key={cat.id}
                              style={
                                selectedCategoryId === cat.id
                                  ? { background: "color-mix(in oklab, var(--bo-brand) 10%, transparent)" }
                                  : undefined
                              }
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(cat.id)}
                                  onChange={(e) =>
                                    setSelectedCategoryIds((prev) =>
                                      e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                                    )
                                  }
                                />
                              </td>
                              <td className="bo-mono muted" style={{ fontSize: 11 }}>
                                #{cat.order}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategoryId(cat.id)}
                                  style={{ all: "unset", cursor: "pointer", display: "block" }}
                                  title="Voir le détail de la catégorie"
                                >
                                  <div className="bo-hstack">
                                    {cat.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={cat.imageUrl}
                                        alt=""
                                        style={{
                                          width: 36,
                                          height: 28,
                                          borderRadius: 4,
                                          objectFit: "cover",
                                          border: "1px solid var(--bo-border)",
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 36,
                                          height: 28,
                                          borderRadius: 4,
                                          background: "var(--bo-panel-2)",
                                          border: "1px solid var(--bo-border)",
                                          display: "grid",
                                          placeItems: "center",
                                          fontSize: 10,
                                          color: "var(--bo-text-dim)",
                                        }}
                                      >
                                        —
                                      </div>
                                    )}
                                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                                  </div>
                                </button>
                              </td>
                              <td className="bo-mono muted" style={{ fontSize: 11 }}>
                                {cat.slug}
                              </td>
                              <td>
                                {cat.isActive ? (
                                  <span className="bo-badge ok">Active</span>
                                ) : (
                                  <span className="bo-badge neutral">Inactive</span>
                                )}
                              </td>
                              <td className="num">
                                <div
                                  style={{
                                    display: "inline-flex",
                                    gap: 4,
                                    flexWrap: "wrap",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <IconButton onClick={() => setSelectedCategoryId(cat.id)} title="Détail">
                                    Détail
                                  </IconButton>
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

                <Panel
                  title="Détail catégorie"
                  subtitle={selectedCategory ? selectedCategory.name : "Sélectionnez une catégorie"}
                >
                  {!selectedCategory ? (
                    <p className="bo-muted" style={{ textAlign: "center", padding: 24 }}>
                      Cliquez sur « Détail » ou le nom d&apos;une catégorie pour le drill-down.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div className="bo-card" style={{ padding: 10 }}>
                        <div className="bo-label">Slug</div>
                        <div className="bo-mono" style={{ fontSize: 12 }}>{selectedCategory.slug}</div>
                      </div>
                      <div className="bo-card" style={{ padding: 10 }}>
                        <div className="bo-label">Statut</div>
                        <div>{selectedCategory.isActive ? "Active" : "Inactive"}</div>
                      </div>
                      <div className="bo-card" style={{ padding: 10 }}>
                        <div className="bo-label">Produits rattachés</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{categoryProductCounts.get(selectedCategory.id) ?? 0}</div>
                      </div>
                      <div className="bo-card" style={{ padding: 10 }}>
                        <div className="bo-label">Description</div>
                        <div className="bo-muted">{selectedCategory.description?.trim() || "—"}</div>
                      </div>
                      <div>
                        <div className="bo-label" style={{ marginBottom: 6 }}>Produits de la catégorie</div>
                        {selectedCategoryProducts.length === 0 ? (
                          <p className="bo-muted">Aucun produit dans cette catégorie.</p>
                        ) : (
                          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                            {selectedCategoryProducts.slice(0, 8).map((p) => (
                              <li key={p.id} className="bo-card" style={{ padding: "7px 9px", display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <span>{p.name ?? "Produit sans nom"}</span>
                                <span className="bo-mono muted">{p.sku ?? "—"}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </Panel>
              </div>
            </>
          )}

          {/* CONTENT */}
          {section === "content" && <ContentManager flash={flash} />}

          {/* ORDERS */}
          {section === "orders" && (
            <div className="bo-grid bo-col-row" style={{ gridTemplateColumns: "1fr minmax(0, 22rem)" }}>
              <Panel
                title="Commandes"
                subtitle={ordersMeta ? `${ordersMeta.total} commande(s)` : ""}
                actions={
                  <select
                    value={ordersStatusFilter}
                    onChange={(e) => {
                      setOrdersStatusFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="bo-input compact"
                    style={{ width: 160 }}
                  >
                    <option value="">Tous statuts</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En traitement</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                }
              >
                {loadingOrders ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Chargement…
                  </p>
                ) : adminOrders.length === 0 ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Aucune commande.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Client</th>
                          <th>Statut</th>
                          <th className="num">Total</th>
                          <th className="num">Lignes</th>
                          <th className="num">Voir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrders.map((o) => (
                          <tr key={o.id}>
                            <td className="bo-mono muted" style={{ fontSize: 11 }}>
                              {new Date(o.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {o.customerEmail ?? o.userId.slice(0, 8) + "…"}
                            </td>
                            <td>{orderStatusBadge(o.status)}</td>
                            <td className="num" style={{ fontWeight: 600 }}>
                              {o.total.toFixed(2)} {o.currency}
                            </td>
                            <td className="num muted">{o.lineCount}</td>
                            <td className="num">
                              <button
                                type="button"
                                onClick={() => void openOrderDetail(o.id)}
                                className="bo-btn"
                                style={{ color: "var(--bo-brand)" }}
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
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--bo-border)",
                      fontSize: 11.5,
                    }}
                  >
                    <span className="bo-muted">
                      Page {ordersMeta.page} / {ordersMeta.totalPages}
                    </span>
                    <div className="bo-hstack">
                      <button
                        type="button"
                        disabled={ordersPage <= 1}
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                        className="bo-btn"
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        disabled={ordersPage >= ordersMeta.totalPages}
                        onClick={() => setOrdersPage((p) => p + 1)}
                        className="bo-btn"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                ) : null}
              </Panel>

              <Panel title="Détail commande" subtitle="Lignes, historique de statut">
                {loadingOrderDetail ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Chargement…
                  </p>
                ) : !orderDetail ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Sélectionnez une commande pour afficher le détail.
                  </p>
                ) : (
                  <div className="bo-vstack" style={{ gap: 12 }}>
                    <div className="bo-hstack" style={{ justifyContent: "space-between" }}>
                      <span className="bo-mono" style={{ fontSize: 11, color: "var(--bo-text-muted)" }}>
                        {orderDetail.id}
                      </span>
                      {orderStatusBadge(orderDetail.status)}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600 }} className="bo-num">
                      {orderDetail.total.toFixed(2)} {orderDetail.currency}
                    </div>
                    <div>
                      <div className="bo-label">Changer le statut</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={orderDetail.status === st}
                            onClick={() => void patchOrderStatus(orderDetail.id, st)}
                            className="bo-btn"
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="bo-label">Historique</div>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          maxHeight: 160,
                          overflowY: "auto",
                          fontSize: 11.5,
                        }}
                      >
                        {(orderDetail.statusHistory ?? []).map((h, i) => (
                          <li
                            key={`${h.at}-${i}`}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              borderBottom: "1px solid var(--bo-border)",
                              padding: "4px 0",
                            }}
                          >
                            <span>{orderStatusBadge(h.status)}</span>
                            <span className="bo-dim bo-mono" style={{ fontSize: 10 }}>
                              {new Date(h.at).toLocaleString("fr-FR")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="bo-label">Lignes</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {orderDetail.items.map((it) => (
                          <li
                            key={it.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              padding: "6px 8px",
                              fontSize: 11.5,
                              background: "var(--bo-panel-2)",
                              borderRadius: 4,
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontWeight: 500, minWidth: 0 }}>{it.productName}</span>
                            <span className="bo-mono bo-muted" style={{ fontSize: 11 }}>
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
          )}

          {/* USERS */}
          {section === "users" && (
            <>
              <div className="bo-grid bo-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <KpiCard label="Total" value={users.length} hint="comptes enregistrés" />
                <KpiCard label="Actifs" value={activeUsers} hint={`${users.length - activeUsers} inactifs`} />
                <KpiCard label="Administrateurs" value={adminCount} hint={`${users.length - adminCount} clients`} />
              </div>

              <Panel
                title="Gestion des utilisateurs"
                subtitle={`${users.length} compte${users.length > 1 ? "s" : ""}`}
                actions={
                  <>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadUsers(search)}
                      placeholder="Rechercher un email…"
                      className="bo-input compact"
                      style={{ width: 220 }}
                    />
                    <button className="bo-btn primary" type="button" onClick={() => loadUsers(search)}>
                      Rechercher
                    </button>
                  </>
                }
              >
                {loadingUsers ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Chargement…
                  </p>
                ) : users.length === 0 ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Aucun utilisateur.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Dernière connexion</th>
                          <th className="num">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="bo-hstack">
                                <span
                                  className="bo-avatar-sm"
                                  style={{
                                    background: `oklch(0.65 0.12 ${(u.email.charCodeAt(0) * 5) % 360})`,
                                  }}
                                >
                                  {u.email.slice(0, 2).toUpperCase()}
                                </span>
                                <span style={{ fontWeight: 500 }}>{u.email}</span>
                              </div>
                            </td>
                            <td>
                              {u.role === "admin" ? (
                                <span className="bo-badge brand">
                                  <Icon.Shield /> Admin
                                </span>
                              ) : (
                                <span className="bo-badge neutral">Client</span>
                              )}
                            </td>
                            <td>
                              {u.status === "active" ? (
                                <span className="bo-badge ok">Actif</span>
                              ) : u.status === "pending" ? (
                                <span className="bo-badge warn">En attente</span>
                              ) : (
                                <span className="bo-badge danger">Inactif</span>
                              )}
                            </td>
                            <td className="muted" style={{ fontSize: 11 }}>
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}
                            </td>
                            <td className="num">
                              <div
                                style={{
                                  display: "inline-flex",
                                  gap: 4,
                                  flexWrap: "wrap",
                                  justifyContent: "flex-end",
                                }}
                              >
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
                <button className="bo-btn primary" type="button" onClick={loadContactMessages}>
                  <Icon.Refresh /> Rafraîchir
                </button>
              }
            >
              {loadingMessages ? (
                <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                  Chargement…
                </p>
              ) : contactMessages.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div
                    style={{
                      margin: "0 auto 8px",
                      width: 36,
                      height: 36,
                      display: "grid",
                      placeItems: "center",
                      background: "var(--bo-panel-2)",
                      borderRadius: 8,
                      color: "var(--bo-text-dim)",
                    }}
                  >
                    <Icon.Messages />
                  </div>
                  <p className="bo-muted">Aucun message pour le moment.</p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {contactMessages
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((msg) => (
                      <li
                        key={msg.id}
                        style={{
                          padding: "12px 0",
                          borderTop: "1px solid var(--bo-border)",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          className="bo-avatar-sm"
                          style={{
                            background: `oklch(0.65 0.12 ${(msg.email.charCodeAt(0) * 7) % 360})`,
                            flex: "none",
                            width: 28,
                            height: 28,
                          }}
                        >
                          {msg.email.slice(0, 2).toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{msg.subject}</span>
                            <span className="bo-dim bo-mono" style={{ fontSize: 10 }}>
                              {new Date(msg.createdAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <a
                            href={`mailto:${msg.email}`}
                            style={{ color: "var(--bo-brand)", fontSize: 11.5 }}
                          >
                            {msg.email}
                          </a>
                          <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }} className="bo-muted">
                            {msg.message}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <Panel title="Paramètres" subtitle="Configuration de l'instance back office">
              <div className="bo-vstack" style={{ gap: 12 }}>
                <div>
                  <div className="bo-label">Compte connecté</div>
                  <div className="bo-mono">{user?.email ?? "—"}</div>
                </div>
                <div>
                  <div className="bo-label">Rôle</div>
                  <span className="bo-badge brand">{user?.role ?? "—"}</span>
                </div>
                <div>
                  <div className="bo-label">Environnement</div>
                  <span className="bo-badge neutral">PROD</span>
                </div>
                <div>
                  <div className="bo-label">Build</div>
                  <span className="bo-mono bo-muted">v2.14.3 · a7f9e2</span>
                </div>
              </div>
            </Panel>
          )}
        </main>
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
