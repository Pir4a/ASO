"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import "./backoffice.css";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { triggerBoTransition } from "@/components/layout/RouteFlourish";
import { ProductForm } from "@/components/backoffice/ProductForm";
import { ContentManager } from "@/components/backoffice/ContentManager";
import { InvoicesPanel } from "@/components/backoffice/InvoicesPanel";
import { CreditNotesPanel } from "@/components/backoffice/CreditNotesPanel";
import { ChatPanel } from "@/components/backoffice/ChatPanel";
import { AdminOrderForm } from "@/components/backoffice/AdminOrderForm";
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
  sku?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: "in_stock" | "low_stock" | "out_of_stock" | "new";
  thumbnailUrl?: string;
  featured?: boolean;
  featuredOrder?: number;
  published?: boolean;
  category?: { id: string; name: string };
  categoryId?: string;
  vatRate?: number;
  listPriority?: number;
  galleryUrls?: string[];
  specs?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

type AdminUser = {
  id: string;
  email: string;
  role: "customer" | "admin";
  firstName?: string | null;
  lastName?: string | null;
  fullName: string | null;
  status: "active" | "inactive" | "pending";
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  orderCount: number;
  revenue: number;
  addressCount: number;
};

type ContactMessage = {
  id: string;
  subject: string;
  email: string;
  message: string;
  createdAt: string;
  // CDC XVI.1 — drives the "non traités" badge in the sidebar.
  isRead: boolean;
};

type AdminOrderListRow = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: string;
  total: number;
  currency: string;
  paymentMethod: string | null;
  paymentStatus?: string;
  paidAt: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  createdAt: string;
  updatedAt: string;
  customerEmail: string | null;
  lineCount: number;
};

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: string;
  total: number;
  currency: string;
  paymentMethod: string | null;
  paymentId?: string;
  paymentStatus?: string;
  paidAt: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  statusHistory: {
    status: string;
    at: string;
    byUserId?: string | null;
    byEmail?: string | null;
  }[];
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
  | "invoices"
  | "users"
  | "messages"
  | "chat"
  | "settings";

type GlobalSearchSuggestion = {
  key: string;
  kind: "product" | "category" | "order" | "user";
  section: Section;
  label: string;
  meta: string;
  targetKey: string;
  query: string;
  orderId?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Cheap relevance score for the global-search dropdown — exact match
    > prefix > contains, with later occurrences progressively damped. */
function scoreQuery(value: string, query: string): number {
  const hay = value.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  const idx = hay.indexOf(q);
  if (idx >= 0) return 50 - Math.min(idx, 20);
  return 0;
}

const SECTION_LABEL: Record<Section, string> = {
  overview: "Overview",
  analytics: "Analytique",
  products: "Produits",
  categories: "Catégories",
  content: "Contenu",
  orders: "Commandes",
  invoices: "Factures & Avoirs",
  users: "Utilisateurs",
  messages: "Messages",
  chat: "Chat",
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
  // CDC XVI.1 — sidebar badge counts only unread; we keep it as its own piece
  // of state so an admin who hasn't opened the Messages tab still sees the
  // correct count (the full list isn't loaded yet at that point).
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  // #11 — sortable / filterable / paginated products table.
  type ProductSortKey =
    | "name"
    | "sku"
    | "category"
    | "price"
    | "stock"
    | "createdAt"
    | "published";
  const [productSortBy, setProductSortBy] = useState<ProductSortKey>("createdAt");
  const [productSortDir, setProductSortDir] = useState<"asc" | "desc">("desc");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("");
  const [productAvailabilityFilter, setProductAvailabilityFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");
  const [productPublishedFilter, setProductPublishedFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [productPriceMin, setProductPriceMin] = useState<string>("");
  const [productPriceMax, setProductPriceMax] = useState<string>("");
  const [productPage, setProductPage] = useState<number>(1);
  const [productPageSize, setProductPageSize] = useState<10 | 25 | 50>(25);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [categorySearch, setCategorySearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchFocused, setGlobalSearchFocused] = useState(false);
  const [globalSearchActiveIndex, setGlobalSearchActiveIndex] = useState(-1);
  const [highlightTargetKey, setHighlightTargetKey] = useState<string | null>(null);
  const [pendingTargetKey, setPendingTargetKey] = useState<string | null>(null);
  const globalSearchRef = useRef<HTMLDivElement | null>(null);
  const globalSearchInputRef = useRef<HTMLInputElement | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [adminOrders, setAdminOrders] = useState<AdminOrderListRow[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("");
  const [ordersPaymentMethodFilter, setOrdersPaymentMethodFilter] = useState<string>("");
  const [adminOrderModalOpen, setAdminOrderModalOpen] = useState(false);
  const [ordersPaymentStatusFilter, setOrdersPaymentStatusFilter] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  // #29 — single category selected for the drill-down side panel.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", imageUrl: "" });
  const [showProductForm, setShowProductForm] = useState(false);
  // #11 follow-up — full edit modal pre-fills the same form in PATCH mode.
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const flash = (kind: "success" | "error", text: string) => {
    setFeedback({ kind, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const uploadCategoryImage = (categoryId: string) => {
    // Lazy-build an in-memory file input so we don't need to render hidden DOM
    // for every row; one click → one upload → category PATCH.
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await authFetch(`${API_URL}/admin/media`, { method: "POST", body: form });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { url: string };
        await updateCategory(categoryId, { imageUrl: `${API_URL}${data.url}` });
        flash("success", "Image mise à jour.");
      } catch (e) {
        flash("error", `Téléversement impossible: ${(e as Error).message}`);
      }
    };
    input.click();
  };

  const downloadCsv = async (path: string, filename: string) => {
    try {
      const res = await authFetch(`${API_URL}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash("success", `${filename} téléchargé.`);
    } catch (e) {
      flash("error", `Export impossible: ${(e as Error).message}`);
    }
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
      // Admin endpoint returns drafts too (the public /products filters them out).
      const res = await authFetch(`${API_URL}/products/admin/all`);
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
      const list = (await res.json()) as ContactMessage[];
      setContactMessages(list);
      // Keep the sidebar badge in sync without an extra round-trip when the
      // full list has just been fetched.
      setUnreadMessagesCount(list.filter((m) => !m.isRead).length);
    } catch {
      flash("error", "Chargement des messages impossible.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Cheap COUNT(*) endpoint, called from the dashboard so the sidebar badge is
  // accurate even before the admin opens the Messages section.
  const loadUnreadMessagesCount = async () => {
    try {
      const res = await authFetch(`${API_URL}/contact/admin/unread-count`);
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { unread: number };
      setUnreadMessagesCount(body.unread);
    } catch {
      // Silent — the sidebar badge just falls back to "no badge" rather than
      // surfacing an error toast on every dashboard load.
    }
  };

  // CDC XVI.1 — clicking a row marks it as read. We optimistically update
  // local state so the dot vanishes immediately, then reconcile with the
  // server response.
  const markMessageAsRead = async (id: string) => {
    const target = contactMessages.find((m) => m.id === id);
    if (!target || target.isRead) return;
    setContactMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    );
    setUnreadMessagesCount((c) => Math.max(0, c - 1));
    try {
      const res = await authFetch(`${API_URL}/contact/admin/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
    } catch {
      // Roll back on failure so the badge stays truthful.
      setContactMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: false } : m)),
      );
      setUnreadMessagesCount((c) => c + 1);
      flash("error", "Impossible de marquer le message comme lu.");
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

  const loadAdminOrders = async (
    page = ordersPage,
    status = ordersStatusFilter,
    paymentMethod = ordersPaymentMethodFilter,
    paymentStatus = ordersPaymentStatusFilter,
  ) => {
    setLoadingOrders(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) sp.set("status", status);
      if (paymentMethod) sp.set("paymentMethod", paymentMethod);
      if (paymentStatus) sp.set("paymentStatus", paymentStatus);
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
      // Fallback path: if loadContactMessages errors, the cheap count endpoint
      // still keeps the sidebar badge truthful.
      loadUnreadMessagesCount(),
      loadDashboard(),
      section === "orders"
        ? loadAdminOrders(
            ordersPage,
            ordersStatusFilter,
            ordersPaymentMethodFilter,
            ordersPaymentStatusFilter,
          )
        : Promise.resolve(),
    ]);

  const applyGlobalSuggestion = (s: GlobalSearchSuggestion) => {
    setGlobalSearch("");
    setGlobalSearchFocused(false);
    setGlobalSearchActiveIndex(-1);
    setSection(s.section);
    setPendingTargetKey(s.targetKey);
    if (s.kind === "product") {
      setProductSearch(s.query);
      setProductPage(1);
    } else if (s.kind === "category") {
      setCategorySearch(s.query);
    } else if (s.kind === "user") {
      setSearch(s.query);
      void loadUsers(s.query);
    } else if (s.kind === "order" && s.orderId) {
      void openOrderDetail(s.orderId);
    }
    window.setTimeout(() => {
      globalSearchInputRef.current?.blur();
    }, 0);
  };

  useEffect(() => {
    // Orders are pulled here too — the global search dropdown needs them
    // to surface order matches before the operator opens the Orders tab.
    void Promise.all([
      loadCategories(),
      loadProducts(),
      loadUsers(),
      loadContactMessages(),
      loadUnreadMessagesCount(),
      loadDashboard(),
      loadAdminOrders(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (section !== "orders") return;
    void loadAdminOrders(
      ordersPage,
      ordersStatusFilter,
      ordersPaymentMethodFilter,
      ordersPaymentStatusFilter,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    section,
    ordersPage,
    ordersStatusFilter,
    ordersPaymentMethodFilter,
    ordersPaymentStatusFilter,
  ]);

  useEffect(() => {
    setGlobalSearchActiveIndex(-1);
  }, [globalSearch]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!globalSearchRef.current) return;
      if (globalSearchRef.current.contains(e.target as Node)) return;
      setGlobalSearchFocused(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!pendingTargetKey) return;
    const target = pendingTargetKey;
    const timer = window.setTimeout(() => {
      const escaped = target.replace(/"/g, '\\"');
      const el = document.querySelector<HTMLElement>(`[data-bo-target="${escaped}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      setHighlightTargetKey(target);
      setPendingTargetKey(null);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [
    pendingTargetKey,
    section,
    productSearch,
    categorySearch,
    search,
    products.length,
    categories.length,
    users.length,
    adminOrders.length,
  ]);

  useEffect(() => {
    if (!highlightTargetKey) return;
    const timer = window.setTimeout(() => setHighlightTargetKey(null), 2500);
    return () => window.clearTimeout(timer);
  }, [highlightTargetKey]);

  /* ------------------------------- Actions -------------------------------- */

  const runAction = async (
    userId: string,
    action: "activate" | "deactivate" | "delete" | "promote" | "demote" | "reset",
  ) => {
    if (action === "delete") {
      const target = users.find((u) => u.id === userId);
      const label = target?.fullName ?? target?.email ?? "ce compte";
      const confirmed = window.confirm(
        `Supprimer définitivement ${label} ?\n\n` +
          "Cette action est irréversible. Conformément au RGPD (art. 17 — droit à l'effacement), " +
          "toutes les données personnelles associées seront supprimées et ne pourront pas être restaurées. " +
          "Les commandes et factures liées sont conservées pour des raisons comptables et fiscales.",
      );
      if (!confirmed) return;
    }
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

  const togglePublished = async (p: Product) => {
    const next = !(p.published ?? true);
    try {
      const res = await authFetch(`${API_URL}/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) throw new Error();
      await loadProducts();
      flash("success", next ? "Produit publié." : "Produit passé en brouillon.");
    } catch {
      flash("error", "Mise à jour impossible.");
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

  const categoryDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((c) => c.id === active.id);
    const newIndex = sorted.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sorted, oldIndex, newIndex);
    await reorderCategories(next.map((c) => c.id));
  };

  const reorderCategories = async (orderedIds: string[]) => {
    // Optimistic local reorder so the row doesn't jump back during the request.
    setCategories((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      return orderedIds
        .map((id, i) => {
          const c = byId.get(id);
          return c ? { ...c, order: i } : null;
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
    });
    try {
      await authFetch(`${API_URL}/categories/reorder/list`, {
        method: "PATCH",
        body: JSON.stringify({ items: orderedIds.map((id, i) => ({ id, order: i })) }),
      });
      await loadCategories();
    } catch {
      flash("error", "Réordonnancement impossible.");
      await loadCategories();
    }
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

  const globalSuggestions = useMemo<GlobalSearchSuggestion[]>(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const items: Array<GlobalSearchSuggestion & { score: number }> = [];

    for (const p of products) {
      const name = p.name ?? "";
      const sku = p.sku ?? "";
      const slug = p.slug ?? "";
      const categoryName = p.category?.name ?? "";
      const score = Math.max(
        scoreQuery(name, q),
        scoreQuery(sku, q),
        scoreQuery(slug, q),
        scoreQuery(categoryName, q),
      );
      if (score <= 0) continue;
      items.push({
        key: `p:${p.id}`,
        kind: "product",
        section: "products",
        label: name || slug || p.id,
        meta: [sku, categoryName].filter(Boolean).join(" · "),
        targetKey: `product:${p.id}`,
        query: name || sku || slug,
        score,
      });
    }

    for (const c of categories) {
      const score = Math.max(scoreQuery(c.name, q), scoreQuery(c.slug, q));
      if (score <= 0) continue;
      items.push({
        key: `c:${c.id}`,
        kind: "category",
        section: "categories",
        label: c.name,
        meta: c.slug,
        targetKey: `category:${c.id}`,
        query: c.name,
        score,
      });
    }

    for (const u of users) {
      const fullName = u.fullName ?? "";
      const score = Math.max(scoreQuery(u.email, q), scoreQuery(fullName, q));
      if (score <= 0) continue;
      items.push({
        key: `u:${u.id}`,
        kind: "user",
        section: "users",
        label: fullName || u.email,
        meta: fullName ? u.email : "",
        targetKey: `user:${u.id}`,
        query: u.email,
        score,
      });
    }

    for (const o of adminOrders) {
      const customer = o.customerEmail ?? "";
      const score = Math.max(scoreQuery(o.orderNumber, q), scoreQuery(customer, q));
      if (score <= 0) continue;
      items.push({
        key: `o:${o.id}`,
        kind: "order",
        section: "orders",
        label: o.orderNumber,
        meta: customer || o.status,
        targetKey: `order:${o.id}`,
        query: o.orderNumber,
        orderId: o.id,
        score,
      });
    }

    items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
    return items.slice(0, 12).map(({ score: _score, ...rest }) => rest);
  }, [adminOrders, categories, globalSearch, products, users]);

  const globalCategorySuggestions = useMemo(
    () => globalSuggestions.filter((s) => s.kind === "category").slice(0, 5),
    [globalSuggestions],
  );
  const globalProposalSuggestions = useMemo(
    () => globalSuggestions.filter((s) => s.kind !== "category").slice(0, 3),
    [globalSuggestions],
  );
  const globalVisibleSuggestions = useMemo(
    () => [...globalCategorySuggestions, ...globalProposalSuggestions],
    [globalCategorySuggestions, globalProposalSuggestions],
  );

  // #11 — text search + dropdown filters + price range, then sort, then paginate.
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const min = productPriceMin === "" ? null : Number(productPriceMin);
    const max = productPriceMax === "" ? null : Number(productPriceMax);
    return products.filter((p) => {
      if (q) {
        const hay = `${p.name ?? ""} ${p.sku ?? ""} ${p.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (productCategoryFilter && (p.category?.id ?? p.categoryId) !== productCategoryFilter) {
        return false;
      }
      if (productAvailabilityFilter !== "all") {
        const stock = p.stock ?? 0;
        if (productAvailabilityFilter === "out_of_stock" && stock !== 0) return false;
        if (productAvailabilityFilter === "low_stock" && (stock === 0 || stock >= 5)) return false;
        if (productAvailabilityFilter === "in_stock" && stock < 5) return false;
      }
      if (productPublishedFilter !== "all") {
        const pub = p.published !== false; // default published
        if (productPublishedFilter === "published" && !pub) return false;
        if (productPublishedFilter === "draft" && pub) return false;
      }
      const price = typeof p.price === "number" ? p.price : 0;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;
      return true;
    });
  }, [
    products,
    productSearch,
    productCategoryFilter,
    productAvailabilityFilter,
    productPublishedFilter,
    productPriceMin,
    productPriceMax,
  ]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    const dir = productSortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const get = (p: Product): string | number => {
        switch (productSortBy) {
          case "name":
            return (p.name ?? "").toLowerCase();
          case "sku":
            return (p.sku ?? "").toLowerCase();
          case "category":
            return (p.category?.name ?? "").toLowerCase();
          case "price":
            return typeof p.price === "number" ? p.price : 0;
          case "stock":
            return p.stock ?? 0;
          case "published":
            return p.published === false ? 0 : 1;
          case "createdAt":
            return p.createdAt ? new Date(p.createdAt).getTime() : 0;
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredProducts, productSortBy, productSortDir]);

  const productPageCount = Math.max(1, Math.ceil(sortedProducts.length / productPageSize));
  const productCurrentPage = Math.min(productPage, productPageCount);
  const paginatedProducts = useMemo(() => {
    const start = (productCurrentPage - 1) * productPageSize;
    return sortedProducts.slice(start, start + productPageSize);
  }, [sortedProducts, productCurrentPage, productPageSize]);

  const toggleProductSort = (key: ProductSortKey) => {
    setProductSortBy((prev) => {
      if (prev === key) {
        setProductSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      // New column: default to ascending for text fields, descending for date/numeric.
      setProductSortDir(key === "name" || key === "sku" || key === "category" ? "asc" : "desc");
      return key;
    });
  };

  const sortIndicator = (key: ProductSortKey) =>
    productSortBy === key ? (productSortDir === "asc" ? " ↑" : " ↓") : "";

  const allOnPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.has(p.id));

  const toggleSelectAllOnPage = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginatedProducts.forEach((p) => next.delete(p.id));
      } else {
        paginatedProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleProductSelected = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearProductSelection = () => setSelectedProductIds(new Set());

  // Reset to page 1 whenever the visible set changes shape (filters, search, page size).
  useEffect(() => {
    setProductPage(1);
  }, [
    productSearch,
    productCategoryFilter,
    productAvailabilityFilter,
    productPublishedFilter,
    productPriceMin,
    productPriceMax,
    productPageSize,
  ]);

  const bulkDeleteProducts = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    if (!confirm(`Supprimer ${ids.length} produit${ids.length > 1 ? "s" : ""} ?`)) return;
    let ok = 0;
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      const res = await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (res.ok) ok += 1;
    }
    clearProductSelection();
    await loadProducts();
    if (ok === ids.length) flash("success", `${ok} produit${ok > 1 ? "s" : ""} supprimé${ok > 1 ? "s" : ""}.`);
    else flash("error", `${ok}/${ids.length} produits supprimés.`);
  };

  const bulkSetPublished = async (published: boolean) => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    let ok = 0;
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      const res = await authFetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      });
      if (res.ok) ok += 1;
    }
    clearProductSelection();
    await loadProducts();
    flash(
      ok === ids.length ? "success" : "error",
      `${ok}/${ids.length} produits ${published ? "publiés" : "passés en brouillon"}.`,
    );
  };

  const bulkSetCategory = async (categoryId: string) => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0 || !categoryId) return;
    let ok = 0;
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      const res = await authFetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ categoryId }),
      });
      if (res.ok) ok += 1;
    }
    clearProductSelection();
    await loadProducts();
    flash(
      ok === ids.length ? "success" : "error",
      `${ok}/${ids.length} produits déplacés.`,
    );
  };

  const filteredCategories = [...categories]
    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  // #29 — drill-down derived data: per-category product counts + selected
  // category resolution + first 8 products attached to the selection.
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
    // CDC XVI.1 — the sidebar uses *unread*, not total, to light up the dot.
    unreadMessages: unreadMessagesCount,
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
        { id: "invoices", name: "Factures & Avoirs", icon: "Doc" },
        { id: "users", name: "Utilisateurs", icon: "Users", count: counts.users },
        {
          id: "messages",
          name: "Messages",
          icon: "Messages",
          // Sidebar count shows non-traités; we hide the badge entirely once
          // every message has been opened (CDC XVI.1 acceptance criterion).
          count: counts.unreadMessages > 0 ? counts.unreadMessages : undefined,
          dot: counts.unreadMessages > 0,
        },
        { id: "chat", name: "Chat", icon: "Messages" },
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

  const paymentStatusBadge = (status?: string | null) => {
    const map: Record<string, { tone: "ok" | "warn" | "neutral" | "danger" | "brand"; label: string }> = {
      paid: { tone: "ok", label: "Payé" },
      unpaid: { tone: "warn", label: "En attente" },
      failed: { tone: "danger", label: "Échoué" },
      refunded: { tone: "neutral", label: "Remboursé" },
    };
    const key = (status ?? "unpaid").toLowerCase();
    const m = map[key] ?? { tone: "neutral" as const, label: status ?? "—" };
    return <span className={`bo-badge ${m.tone}`}>{m.label}</span>;
  };

  const paymentMethodLabel = (
    method?: string | null,
    brand?: string | null,
    last4?: string | null,
  ) => {
    if (!method) {
      return <span className="bo-muted" style={{ fontSize: 11 }}>—</span>;
    }
    const m = method.toLowerCase();
    const niceMethod =
      m === "card"
        ? "Carte"
        : m === "iban"
          ? "IBAN"
          : m === "cash"
            ? "Espèces"
            : method.charAt(0).toUpperCase() + method.slice(1);
    const niceBrand = brand
      ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
      : null;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          whiteSpace: "nowrap",
        }}
      >
        <span>{niceMethod}</span>
        {niceBrand && <span className="bo-muted">· {niceBrand}</span>}
        {last4 && (
          <span className="bo-mono bo-muted" style={{ fontSize: 10.5 }}>
            •••• {last4}
          </span>
        )}
      </span>
    );
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
          <Image
            src="/logo-mark.png"
            alt=""
            width={32}
            height={32}
            priority
            className="bo-brand-logo"
          />
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
          <div className="bo-search" ref={globalSearchRef}>
            <Icon.Search />
            <input
              ref={globalSearchInputRef}
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setGlobalSearchFocused(true);
              }}
              onFocus={() => {
                setGlobalSearchFocused(true);
                setGlobalSearchActiveIndex(-1);
              }}
              onKeyDown={(e) => {
                if (!globalSearchFocused || globalVisibleSuggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setGlobalSearchActiveIndex((prev) => (prev + 1) % globalVisibleSuggestions.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setGlobalSearchActiveIndex((prev) =>
                    prev <= 0 ? globalVisibleSuggestions.length - 1 : prev - 1,
                  );
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setGlobalSearchFocused(false);
                  setGlobalSearchActiveIndex(-1);
                  return;
                }
                if (e.key === "Enter" && globalSearchActiveIndex >= 0) {
                  e.preventDefault();
                  applyGlobalSuggestion(globalVisibleSuggestions[globalSearchActiveIndex]);
                }
              }}
              placeholder="Rechercher produits, commandes, clients…"
            />
            <kbd>⌘K</kbd>
            {globalSearchFocused && globalSearch.trim().length > 0 ? (
              <div className="bo-search-popover">
                {globalVisibleSuggestions.length === 0 ? (
                  <div className="bo-search-empty">Aucun résultat.</div>
                ) : (
                  <>
                    {globalCategorySuggestions.length > 0 ? (
                      <div className="bo-search-group-label">Catégories</div>
                    ) : null}
                    {globalCategorySuggestions.map((s, idx) => (
                      <button
                        key={s.key}
                        type="button"
                        className={`bo-search-item ${idx === globalSearchActiveIndex ? "active" : ""}`}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onMouseEnter={() => setGlobalSearchActiveIndex(idx)}
                        onClick={() => applyGlobalSuggestion(s)}
                      >
                        <span className="bo-search-item-main">{s.label}</span>
                        <span className="bo-search-item-meta">
                          Catégorie{s.meta ? ` · ${s.meta}` : ""}
                        </span>
                      </button>
                    ))}
                    {globalProposalSuggestions.length > 0 ? (
                      <div className="bo-search-group-label">Propositions</div>
                    ) : null}
                    {globalProposalSuggestions.map((s, idx) => {
                      const absoluteIndex = globalCategorySuggestions.length + idx;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          className={`bo-search-item ${absoluteIndex === globalSearchActiveIndex ? "active" : ""}`}
                          onMouseDown={(ev) => ev.preventDefault()}
                          onMouseEnter={() => setGlobalSearchActiveIndex(absoluteIndex)}
                          onClick={() => applyGlobalSuggestion(s)}
                        >
                          <span className="bo-search-item-main">{s.label}</span>
                          <span className="bo-search-item-meta">
                            {s.kind === "product"
                              ? "Produit"
                              : s.kind === "order"
                                ? "Commande"
                                : "Utilisateur"}
                            {s.meta ? ` · ${s.meta}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            ) : null}
          </div>
          <Link
            href="/"
            className="bo-back-pill"
            title="Retour au site"
            onClick={(e) => {
              e.preventDefault();
              triggerBoTransition("/");
            }}
          >
            <Icon.Home /> Retour au site
          </Link>
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
                  // CDC XVI.1 — the "hint" must reflect the real unread count
                  // backed by isRead, not the total list size.
                  hint={`${unreadMessagesCount} non lu${unreadMessagesCount > 1 ? "s" : ""}`}
                  delta={
                    unreadMessagesCount > 0
                      ? { dir: "up", txt: "+" + unreadMessagesCount }
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
                              <Icon.Warn /> Stock faible
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
                          <th>Paiement</th>
                          <th className="num">Montant</th>
                          <th>Reçue</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrdersPreview.map((o) => {
                          const cust = o.customerEmail ?? (o.userId ? o.userId.slice(0, 8) + "…" : "—");
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
                              <td>{paymentStatusBadge(o.paymentStatus)}</td>
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
                      <div className="bo-card-sub">
                        {contactMessages.length} au total · {unreadMessagesCount} non lu
                        {unreadMessagesCount > 1 ? "s" : ""}
                      </div>
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
                            <span style={{ fontWeight: m.isRead ? 500 : 700 }}>{m.subject}</span>
                            {!m.isRead && (
                              <span
                                title="Non lu"
                                aria-label="Non lu"
                                style={{
                                  display: "inline-block",
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  background: "var(--bo-brand)",
                                  marginInlineStart: 6,
                                }}
                              />
                            )}
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
                  title="Ajouter un produit"
                  subtitle="Nouveau matériel médical"
                  actions={
                    <button className="bo-btn" type="button" onClick={() => setShowProductForm(false)}>
                      <Icon.X /> Fermer
                    </button>
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
                subtitle={`${sortedProducts.length} produit${sortedProducts.length > 1 ? "s" : ""}${sortedProducts.length !== products.length ? ` / ${products.length}` : ""}`}
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
                      className="bo-btn"
                      type="button"
                      onClick={() => void downloadCsv("/products/admin/export.csv", "products.csv")}
                      title="Télécharger en CSV"
                    >
                      Export CSV
                    </button>
                    <button className="bo-btn primary" type="button" onClick={() => setShowProductForm((v) => !v)}>
                      <Icon.Plus /> Ajouter
                    </button>
                  </>
                }
              >
                {/* Filter bar */}
                <div
                  className="bo-hstack"
                  style={{ flexWrap: "wrap", gap: 8, marginBottom: 12 }}
                >
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bo-input compact"
                    style={{ width: 180 }}
                    title="Filtrer par catégorie"
                  >
                    <option value="">Toutes catégories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={productAvailabilityFilter}
                    onChange={(e) =>
                      setProductAvailabilityFilter(
                        e.target.value as typeof productAvailabilityFilter,
                      )
                    }
                    className="bo-input compact"
                    style={{ width: 150 }}
                    title="Filtrer par disponibilité"
                  >
                    <option value="all">Toute disponibilité</option>
                    <option value="in_stock">En stock</option>
                    <option value="low_stock">Stock faible</option>
                    <option value="out_of_stock">Rupture</option>
                  </select>
                  <select
                    value={productPublishedFilter}
                    onChange={(e) =>
                      setProductPublishedFilter(
                        e.target.value as typeof productPublishedFilter,
                      )
                    }
                    className="bo-input compact"
                    style={{ width: 130 }}
                    title="Filtrer par publication"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="published">Publiés</option>
                    <option value="draft">Brouillons</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={productPriceMin}
                    onChange={(e) => setProductPriceMin(e.target.value)}
                    placeholder="Prix min"
                    className="bo-input compact"
                    style={{ width: 110 }}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={productPriceMax}
                    onChange={(e) => setProductPriceMax(e.target.value)}
                    placeholder="Prix max"
                    className="bo-input compact"
                    style={{ width: 110 }}
                  />
                  {(productCategoryFilter ||
                    productAvailabilityFilter !== "all" ||
                    productPublishedFilter !== "all" ||
                    productPriceMin ||
                    productPriceMax) && (
                    <button
                      type="button"
                      className="bo-btn"
                      onClick={() => {
                        setProductCategoryFilter("");
                        setProductAvailabilityFilter("all");
                        setProductPublishedFilter("all");
                        setProductPriceMin("");
                        setProductPriceMax("");
                      }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                {/* Bulk action toolbar */}
                {selectedProductIds.size > 0 && (
                  <div
                    className="bo-hstack aso-anim-fade-rise"
                    style={{
                      gap: 8,
                      flexWrap: "wrap",
                      padding: "8px 10px",
                      marginBottom: 12,
                      background: "var(--bo-brand-soft)",
                      border: "1px solid var(--bo-brand)",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {selectedProductIds.size} sélectionné
                      {selectedProductIds.size > 1 ? "s" : ""}
                    </span>
                    <span className="bo-divider-v" />
                    <button
                      type="button"
                      className="bo-btn"
                      onClick={() => void bulkSetPublished(true)}
                    >
                      Publier
                    </button>
                    <button
                      type="button"
                      className="bo-btn"
                      onClick={() => void bulkSetPublished(false)}
                    >
                      Brouillon
                    </button>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          void bulkSetCategory(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="bo-input compact"
                      style={{ width: 180 }}
                      title="Déplacer vers une catégorie"
                    >
                      <option value="">Déplacer vers…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="bo-btn danger"
                      onClick={() => void bulkDeleteProducts()}
                    >
                      Supprimer
                    </button>
                    <span style={{ flex: 1 }} />
                    <button
                      type="button"
                      className="bo-btn"
                      onClick={clearProductSelection}
                    >
                      Annuler
                    </button>
                  </div>
                )}
                {loadingProducts ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Chargement…
                  </p>
                ) : sortedProducts.length === 0 ? (
                  <p className="bo-muted" style={{ padding: 24, textAlign: "center" }}>
                    Aucun produit trouvé.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th style={{ width: 28 }}>
                            <input
                              type="checkbox"
                              checked={allOnPageSelected}
                              onChange={toggleSelectAllOnPage}
                              aria-label="Sélectionner toute la page"
                            />
                          </th>
                          <th
                            onClick={() => toggleProductSort("name")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Produit{sortIndicator("name")}
                          </th>
                          <th>Description</th>
                          <th
                            onClick={() => toggleProductSort("sku")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            SKU{sortIndicator("sku")}
                          </th>
                          <th
                            onClick={() => toggleProductSort("category")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Catégorie{sortIndicator("category")}
                          </th>
                          <th
                            className="num"
                            onClick={() => toggleProductSort("price")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Prix HT{sortIndicator("price")}
                          </th>
                          <th className="num">TVA</th>
                          <th className="num">Prix TTC</th>
                          <th
                            className="num"
                            onClick={() => toggleProductSort("stock")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Stock{sortIndicator("stock")}
                          </th>
                          <th>Statut</th>
                          <th>Vedette</th>
                          <th
                            onClick={() => toggleProductSort("published")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Publication{sortIndicator("published")}
                          </th>
                          <th
                            onClick={() => toggleProductSort("createdAt")}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            Créé le{sortIndicator("createdAt")}
                          </th>
                          <th className="num">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((p) => {
                          const vat = p.vatRate ?? 20;
                          const ttc =
                            typeof p.price === "number" ? p.price * (1 + vat / 100) : null;
                          return (
                            <tr
                              key={p.id}
                              data-bo-target={`product:${p.id}`}
                              className={
                                highlightTargetKey === `product:${p.id}` ? "bo-row-highlight" : undefined
                              }
                              style={{
                                background: selectedProductIds.has(p.id)
                                  ? "var(--bo-brand-soft)"
                                  : undefined,
                              }}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.has(p.id)}
                                  onChange={() => toggleProductSelected(p.id)}
                                  aria-label={`Sélectionner ${p.name ?? p.id}`}
                                />
                              </td>
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
                              <td
                                className="muted"
                                style={{
                                  maxWidth: 220,
                                  fontSize: 11.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={p.description ?? ""}
                              >
                                {p.description
                                  ? p.description.length > 80
                                    ? `${p.description.slice(0, 80)}…`
                                    : p.description
                                  : "—"}
                              </td>
                              <td className="bo-mono" style={{ fontSize: 11 }}>
                                {p.sku ?? "—"}
                              </td>
                              <td className="muted">{p.category?.name ?? "—"}</td>
                              <td className="num" style={{ fontWeight: 600 }}>
                                {typeof p.price === "number" ? `${p.price.toFixed(2)} €` : "—"}
                              </td>
                              <td className="num muted">{`${vat} %`}</td>
                              <td className="num muted">
                                {ttc !== null ? `${ttc.toFixed(2)} €` : "—"}
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
                              <td>
                                {p.published === false ? (
                                  <span className="bo-badge warn">Brouillon</span>
                                ) : (
                                  <span className="bo-badge ok">Publié</span>
                                )}
                              </td>
                              <td className="muted" style={{ fontSize: 11 }}>
                                {p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                                  : "—"}
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
                                    onClick={() => setEditingProduct(p)}
                                    title="Éditer le produit"
                                  >
                                    Éditer
                                  </IconButton>
                                  <IconButton
                                    tone={p.published === false ? "emerald" : "slate"}
                                    onClick={() => togglePublished(p)}
                                    title={p.published === false ? "Publier" : "Passer en brouillon"}
                                  >
                                    {p.published === false ? "Publier" : "Brouillon"}
                                  </IconButton>
                                  <IconButton tone="rose" onClick={() => deleteProduct(p.id)} title="Supprimer">
                                    <Icon.Trash />
                                  </IconButton>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination footer */}
                {sortedProducts.length > 0 && (
                  <div
                    className="bo-hstack"
                    style={{
                      gap: 8,
                      flexWrap: "wrap",
                      padding: "10px 4px 0",
                      borderTop: "1px solid var(--bo-border)",
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 11.5 }} className="bo-muted">
                      {sortedProducts.length === 0
                        ? "0"
                        : `${(productCurrentPage - 1) * productPageSize + 1}–${Math.min(productCurrentPage * productPageSize, sortedProducts.length)}`}
                      {" "}sur {sortedProducts.length}
                    </span>
                    <span className="bo-divider-v" />
                    <select
                      value={productPageSize}
                      onChange={(e) =>
                        setProductPageSize(Number(e.target.value) as 10 | 25 | 50)
                      }
                      className="bo-input compact"
                      style={{ width: 80 }}
                      title="Lignes par page"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span style={{ flex: 1 }} />
                    <button
                      type="button"
                      className="bo-btn"
                      disabled={productCurrentPage <= 1}
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    >
                      ← Précédent
                    </button>
                    <span style={{ fontSize: 11.5 }} className="bo-mono">
                      {productCurrentPage} / {productPageCount}
                    </span>
                    <button
                      type="button"
                      className="bo-btn"
                      disabled={productCurrentPage >= productPageCount}
                      onClick={() => setProductPage((p) => Math.min(productPageCount, p + 1))}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </Panel>

              {editingProduct && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Éditer ${editingProduct.name ?? ""}`}
                  className="aso-anim-modal-backdrop"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setEditingProduct(null);
                  }}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.55)",
                    backdropFilter: "blur(2px)",
                    zIndex: 80,
                    display: "grid",
                    placeItems: "start center",
                    overflowY: "auto",
                    padding: "5vh 16px",
                  }}
                >
                  <div
                    className="aso-anim-modal-card"
                    style={{
                      width: "100%",
                      maxWidth: 880,
                      background: "white",
                      borderRadius: 12,
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--bo-border)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          Éditer le produit
                        </div>
                        <div className="bo-muted" style={{ fontSize: 11.5 }}>
                          {editingProduct.name ?? editingProduct.sku ?? editingProduct.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="bo-btn"
                        onClick={() => setEditingProduct(null)}
                        aria-label="Fermer"
                      >
                        <Icon.X />
                      </button>
                    </div>
                    <div style={{ padding: 18 }}>
                      <ProductForm
                        categories={categories}
                        product={editingProduct}
                        onSaved={() => {
                          void loadProducts();
                          setEditingProduct(null);
                          flash("success", "Produit mis à jour.");
                        }}
                        onCancel={() => setEditingProduct(null)}
                      />
                    </div>
                  </div>
                </div>
              )}
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
                    {categorySearch.trim() && (
                      <p
                        className="bo-muted"
                        style={{ fontSize: 11, marginBottom: 8, fontStyle: "italic" }}
                      >
                        Le réordonnancement est désactivé tant qu'un filtre de recherche est actif.
                      </p>
                    )}
                    <DndContext
                      sensors={categoryDndSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleCategoryDragEnd}
                    >
                      <SortableContext
                        items={filteredCategories.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                    <table className="bo-data">
                      <thead>
                        <tr>
                          <th style={{ width: 28 }}></th>
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
                          <SortableCategoryRow
                            key={cat.id}
                            id={cat.id}
                            disabled={categorySearch.trim().length > 0}
                            targetKey={`category:${cat.id}`}
                            highlighted={highlightTargetKey === `category:${cat.id}`}
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
                                <IconButton
                                  onClick={() => setSelectedCategoryId(cat.id)}
                                  title="Voir le détail de la catégorie"
                                >
                                  Détail
                                </IconButton>
                                <IconButton
                                  tone={cat.isActive ? "slate" : "emerald"}
                                  onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })}
                                >
                                  {cat.isActive ? "Désactiver" : "Activer"}
                                </IconButton>
                                <IconButton
                                  onClick={() => uploadCategoryImage(cat.id)}
                                  title="Téléverser une image"
                                >
                                  <Icon.Edit /> Image
                                </IconButton>
                                <IconButton tone="rose" onClick={() => deleteCategory(cat.id)} title="Supprimer">
                                  <Icon.Trash />
                                </IconButton>
                              </div>
                            </td>
                          </SortableCategoryRow>
                        ))}
                      </tbody>
                    </table>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </Panel>

              <Panel
                title="Détail catégorie"
                subtitle={selectedCategory ? selectedCategory.name : "Sélectionnez une catégorie"}
              >
                {!selectedCategory ? (
                  <p className="bo-muted" style={{ textAlign: "center", padding: 24 }}>
                    Cliquez sur « Détail » pour le drill-down.
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
                      <div style={{ fontSize: 22, fontWeight: 700 }}>
                        {categoryProductCounts.get(selectedCategory.id) ?? 0}
                      </div>
                    </div>
                    <div className="bo-card" style={{ padding: 10 }}>
                      <div className="bo-label">Description</div>
                      <div className="bo-muted">{selectedCategory.description?.trim() || "—"}</div>
                    </div>
                    <div>
                      <div className="bo-label" style={{ marginBottom: 6 }}>
                        Produits de la catégorie
                      </div>
                      {selectedCategoryProducts.length === 0 ? (
                        <p className="bo-muted">Aucun produit dans cette catégorie.</p>
                      ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                          {selectedCategoryProducts.slice(0, 8).map((p) => (
                            <li
                              key={p.id}
                              className="bo-card"
                              style={{
                                padding: "7px 9px",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
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
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <select
                      value={ordersStatusFilter}
                      onChange={(e) => {
                        setOrdersStatusFilter(e.target.value);
                        setOrdersPage(1);
                      }}
                      className="bo-input compact"
                      style={{ width: 150 }}
                    >
                      <option value="">Tous statuts</option>
                      <option value="pending">En attente</option>
                      <option value="processing">En traitement</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    <select
                      value={ordersPaymentStatusFilter}
                      onChange={(e) => {
                        setOrdersPaymentStatusFilter(e.target.value);
                        setOrdersPage(1);
                      }}
                      className="bo-input compact"
                      style={{ width: 150 }}
                      title="Statut paiement"
                    >
                      <option value="">Tous paiements</option>
                      <option value="paid">Payé</option>
                      <option value="unpaid">En attente</option>
                      <option value="failed">Échoué</option>
                      <option value="refunded">Remboursé</option>
                    </select>
                    <select
                      value={ordersPaymentMethodFilter}
                      onChange={(e) => {
                        setOrdersPaymentMethodFilter(e.target.value);
                        setOrdersPage(1);
                      }}
                      className="bo-input compact"
                      style={{ width: 130 }}
                      title="Mode paiement"
                    >
                      <option value="">Tous modes</option>
                      <option value="stripe">Stripe</option>
                      <option value="manual">Manuel</option>
                    </select>
                    <button
                      type="button"
                      className="bo-btn"
                      onClick={() => {
                        const sp = new URLSearchParams();
                        if (ordersStatusFilter) sp.set("status", ordersStatusFilter);
                        if (ordersPaymentMethodFilter) sp.set("paymentMethod", ordersPaymentMethodFilter);
                        if (ordersPaymentStatusFilter) sp.set("paymentStatus", ordersPaymentStatusFilter);
                        const qs = sp.toString();
                        void downloadCsv(`/admin/orders/export.csv${qs ? `?${qs}` : ""}`, "orders.csv");
                      }}
                      title="Télécharger les commandes filtrées en CSV"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      className="bo-btn primary"
                      onClick={() => setAdminOrderModalOpen(true)}
                      title="Créer une commande pour un client"
                    >
                      + Nouvelle commande
                    </button>
                  </div>
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
                          <th>N°</th>
                          <th>Date</th>
                          <th>Client</th>
                          <th>Statut</th>
                          <th>Paiement</th>
                          <th className="num">Total</th>
                          <th className="num">Lignes</th>
                          <th className="num">Voir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrders.map((o) => (
                          <tr
                            key={o.id}
                            data-bo-target={`order:${o.id}`}
                            className={
                              highlightTargetKey === `order:${o.id}` ? "bo-row-highlight" : undefined
                            }
                          >
                            <td className="bo-mono" style={{ fontSize: 11, fontWeight: 600 }}>
                              {o.orderNumber}
                            </td>
                            <td className="bo-mono muted" style={{ fontSize: 11 }}>
                              {new Date(o.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {o.customerEmail ?? (o.userId ? o.userId.slice(0, 8) + "…" : "—")}
                            </td>
                            <td>{orderStatusBadge(o.status)}</td>
                            <td>{paymentStatusBadge(o.paymentStatus)}</td>
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
                      <span className="bo-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                        {orderDetail.orderNumber}
                      </span>
                      {orderStatusBadge(orderDetail.status)}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600 }} className="bo-num">
                      {orderDetail.total.toFixed(2)} {orderDetail.currency}
                    </div>
                    <div className="bo-vstack" style={{ gap: 4, fontSize: 11.5 }}>
                      <div className="bo-hstack" style={{ justifyContent: "space-between" }}>
                        <span className="bo-muted">Statut paiement</span>
                        <span>{paymentStatusBadge(orderDetail.paymentStatus)}</span>
                      </div>
                      <div className="bo-hstack" style={{ justifyContent: "space-between" }}>
                        <span className="bo-muted">Mode</span>
                        <span>
                          {paymentMethodLabel(
                            orderDetail.paymentMethod,
                            orderDetail.paymentBrand,
                            orderDetail.paymentLast4,
                          )}
                        </span>
                      </div>
                      {orderDetail.paidAt && (
                        <div className="bo-hstack" style={{ justifyContent: "space-between" }}>
                          <span className="bo-muted">Payé le</span>
                          <span className="bo-mono">{new Date(orderDetail.paidAt).toLocaleString("fr-FR")}</span>
                        </div>
                      )}
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
                          maxHeight: 200,
                          overflowY: "auto",
                          fontSize: 11.5,
                        }}
                      >
                        {(orderDetail.statusHistory ?? []).map((h, i) => (
                          <li
                            key={`${h.at}-${i}`}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                              borderBottom: "1px solid var(--bo-border)",
                              padding: "5px 0",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span>{orderStatusBadge(h.status)}</span>
                              <span className="bo-dim bo-mono" style={{ fontSize: 10 }}>
                                {new Date(h.at).toLocaleString("fr-FR")}
                              </span>
                            </div>
                            {h.byEmail && (
                              <span className="bo-muted" style={{ fontSize: 10.5 }}>
                                par {h.byEmail}
                              </span>
                            )}
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

          {/* INVOICES + CREDIT NOTES */}
          {section === "invoices" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InvoicesPanel flash={flash} />
              <CreditNotesPanel flash={flash} />
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
                    <button
                      className="bo-btn"
                      type="button"
                      onClick={() => void downloadCsv("/admin/users/export.csv", "users.csv")}
                      title="Télécharger en CSV"
                    >
                      Export CSV
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
                          <th>Inscription</th>
                          <th>Dernière connexion</th>
                          <th className="num">Cmd</th>
                          <th className="num">CA</th>
                          <th className="num">Adr.</th>
                          <th className="num">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u.id}
                            data-bo-target={`user:${u.id}`}
                            className={
                              highlightTargetKey === `user:${u.id}` ? "bo-row-highlight" : undefined
                            }
                          >
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
                                <span style={{ display: "flex", flexDirection: "column" }}>
                                  {u.fullName && (
                                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{u.fullName}</span>
                                  )}
                                  <span style={{ fontWeight: 500, fontSize: 11.5, opacity: u.fullName ? 0.65 : 1 }}>
                                    {u.email}
                                  </span>
                                </span>
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
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                            </td>
                            <td className="muted" style={{ fontSize: 11 }}>
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}
                            </td>
                            <td className="num bo-mono" style={{ fontSize: 11 }}>
                              {u.orderCount}
                            </td>
                            <td className="num bo-mono" style={{ fontWeight: 600, fontSize: 11 }}>
                              {Number(u.revenue ?? 0).toFixed(0)} €
                            </td>
                            <td className="num bo-mono muted" style={{ fontSize: 11 }}>
                              {u.addressCount}
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
              subtitle={`${contactMessages.length} message${contactMessages.length > 1 ? "s" : ""} · ${unreadMessagesCount} non lu${unreadMessagesCount > 1 ? "s" : ""}`}
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
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((msg) => (
                      <li
                        key={msg.id}
                        // CDC XVI.1 — opening (clicking) a message flips
                        // isRead. Optimistic update lives in markMessageAsRead.
                        onClick={() => void markMessageAsRead(msg.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void markMessageAsRead(msg.id);
                          }
                        }}
                        style={{
                          padding: "12px 8px",
                          borderTop: "1px solid var(--bo-border)",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          cursor: msg.isRead ? "default" : "pointer",
                          background: msg.isRead ? "transparent" : "var(--bo-panel-2)",
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
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: msg.isRead ? 500 : 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {!msg.isRead && (
                                <span
                                  title="Non lu"
                                  aria-label="Message non lu"
                                  style={{
                                    display: "inline-block",
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    background: "var(--bo-brand)",
                                  }}
                                />
                              )}
                              {msg.subject}
                            </span>
                            <span className="bo-dim bo-mono" style={{ fontSize: 10 }}>
                              {new Date(msg.createdAt).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <a
                            href={`mailto:${msg.email}`}
                            style={{ color: "var(--bo-brand)", fontSize: 11.5 }}
                            onClick={(e) => e.stopPropagation()}
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

          {/* CHAT */}
          {section === "chat" && <ChatPanel flash={flash} />}

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

      {adminOrderModalOpen && (
        <AdminOrderForm
          flash={flash}
          onClose={() => setAdminOrderModalOpen(false)}
          onCreated={() => {
            void loadAdminOrders(1, ordersStatusFilter, ordersPaymentMethodFilter, ordersPaymentStatusFilter);
          }}
        />
      )}
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

/**
 * Sortable wrapper for a categories table row. Renders a drag handle in
 * the leading cell that drives the row's position via @dnd-kit.
 */
function SortableCategoryRow({
  id,
  disabled,
  targetKey,
  highlighted,
  children,
}: {
  id: string;
  disabled?: boolean;
  targetKey?: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
    background: isDragging ? "var(--bo-panel-2)" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      data-bo-target={targetKey}
      className={highlighted ? "bo-row-highlight" : undefined}
    >
      <td style={{ padding: "0 4px" }}>
        <button
          type="button"
          aria-label="Glisser pour réordonner"
          title="Glisser pour réordonner"
          disabled={disabled}
          {...attributes}
          {...listeners}
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            border: "none",
            background: "transparent",
            color: "var(--bo-text-dim)",
            cursor: disabled ? "not-allowed" : "grab",
            opacity: disabled ? 0.3 : 1,
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" aria-hidden="true">
            <circle cx="6" cy="3" r="1.2" />
            <circle cx="10" cy="3" r="1.2" />
            <circle cx="6" cy="8" r="1.2" />
            <circle cx="10" cy="8" r="1.2" />
            <circle cx="6" cy="13" r="1.2" />
            <circle cx="10" cy="13" r="1.2" />
          </svg>
        </button>
      </td>
      {children}
    </tr>
  );
}
