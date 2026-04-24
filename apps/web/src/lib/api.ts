import { categories as mockCategories, slides as mockSlides, topProducts as mockProducts } from "@/data/mock";
import type { Category, Product, CarouselSlide, HomepageText } from "@bootstrap/types";

export const MAX_CAROUSEL_SLIDES = 3;

export const API_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL || "http://api:3001/api")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}

function mapProduct(p: any): Product {
  const listPriority = p.listPriority !== undefined ? Number(p.listPriority) : 0;
  const galleryUrls = Array.isArray(p.galleryUrls)
    ? (p.galleryUrls as string[]).filter((u) => typeof u === "string" && u.trim().length > 0)
    : undefined;
  const specs =
    p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)
      ? (p.specs as Record<string, string>)
      : undefined;
  const stock = p.stock !== undefined ? Number(p.stock) : undefined;
  const vatRate = p.vatRate !== undefined && p.vatRate !== null ? Number(p.vatRate) : 20;

  // Backend returns 'price' (decimal/number in major unit), Frontend expects 'priceCents'
  if (p.price !== undefined && p.priceCents === undefined) {
    return {
      ...p,
      priceCents: Math.round(Number(p.price) * 100),
      currency: p.currency || "EUR",
      vatRate,
      listPriority,
      galleryUrls,
      specs,
      stock,
    };
  }
  return { ...p, vatRate, listPriority, galleryUrls, specs, stock };
}

export type ProductBrowseMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductSearchMeta = ProductBrowseMeta & {
  tookMs?: number;
  relevanceRefined?: boolean;
};

export type ProductSearchFacets = {
  categories: { id: string; name: string; slug: string; count: number }[];
};

export const PRODUCT_SEARCH_SORT = [
  "relevance",
  "price_asc",
  "price_desc",
  "novelty_desc",
  "novelty_asc",
  "availability_asc",
  "availability_desc",
] as const;

export type ProductSearchSortParam = (typeof PRODUCT_SEARCH_SORT)[number];

export async function getProductsSearch(filters: {
  q?: string;
  categorySlug?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  inStockOnly?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; meta: ProductSearchMeta; facets: ProductSearchFacets }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const sort = PRODUCT_SEARCH_SORT.includes(filters.sort as ProductSearchSortParam)
    ? (filters.sort as ProductSearchSortParam)
    : "relevance";

  const sp = new URLSearchParams();
  if (filters.q?.trim()) sp.set("q", filters.q.trim());
  if (filters.categorySlug?.trim()) sp.set("categorySlug", filters.categorySlug.trim());
  if (filters.categoryId?.trim()) sp.set("categoryId", filters.categoryId.trim());
  if (filters.minPrice?.trim()) sp.set("minPrice", filters.minPrice.trim());
  if (filters.maxPrice?.trim()) sp.set("maxPrice", filters.maxPrice.trim());
  if (filters.inStockOnly) sp.set("inStockOnly", "1");
  sp.set("sort", sort);
  sp.set("page", String(page));
  sp.set("limit", String(limit));

  const res = await fetch(`${API_URL}/products/search?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  const body = (await res.json()) as {
    data?: unknown[];
    meta?: ProductSearchMeta;
    facets?: ProductSearchFacets;
  };
  return {
    products: (body.data ?? []).map(mapProduct),
    meta: {
      total: body.meta?.total ?? 0,
      page: body.meta?.page ?? page,
      pageSize: body.meta?.pageSize ?? limit,
      totalPages: body.meta?.totalPages ?? 1,
      tookMs: body.meta?.tookMs,
      relevanceRefined: body.meta?.relevanceRefined,
    },
    facets: body.facets ?? { categories: [] },
  };
}

function sortProductsForCategoryListing(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const pr = (b.listPriority ?? 0) - (a.listPriority ?? 0);
    if (pr !== 0) return pr;
    const aAvail = (a.stock ?? 0) > 0 ? 0 : 1;
    const bAvail = (b.stock ?? 0) > 0 ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    return a.name.localeCompare(b.name);
  });
}

export async function getProductsByCategorySlug(
  categorySlug: string,
  options?: { page?: number; limit?: number },
): Promise<{ products: Product[]; meta: ProductBrowseMeta }> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(48, Math.max(1, options?.limit ?? 12));
  const qs = new URLSearchParams({
    categorySlug,
    page: String(page),
    limit: String(limit),
  });
  try {
    const raw = await fetchJson<{ data: any[]; meta: ProductBrowseMeta }>(`/products?${qs.toString()}`);
    return {
      products: (raw.data ?? []).map(mapProduct),
      meta: raw.meta,
    };
  } catch {
    const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) {
      return {
        products: [],
        meta: { total: 0, page: 1, pageSize: limit, totalPages: 1 },
      };
    }
    const filtered = sortProductsForCategoryListing(
      allProducts.filter((p) => p.categoryId === cat.id),
    );
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const slice = filtered.slice((page - 1) * limit, page * limit);
    return {
      products: slice,
      meta: { total, page, pageSize: limit, totalPages },
    };
  }
}

export async function getRelatedProducts(productSlug: string, limit = 6): Promise<Product[]> {
  try {
    const list = await fetchJson<any[]>(`/products/${encodeURIComponent(productSlug)}/related?limit=${limit}`);
    return (list ?? []).map(mapProduct);
  } catch {
    return [];
  }
}

/** Paginated full catalog (`GET /products?page=&limit=`) with same sort as category browse. */
export async function getProductsCatalog(
  options?: { page?: number; limit?: number },
): Promise<{ products: Product[]; meta: ProductBrowseMeta }> {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(48, Math.max(1, options?.limit ?? 12));
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  try {
    const raw = await fetchJson<{ data: any[]; meta: ProductBrowseMeta }>(`/products?${qs.toString()}`);
    return {
      products: (raw.data ?? []).map(mapProduct),
      meta: raw.meta,
    };
  } catch {
    const allProducts = await getProducts();
    const sorted = sortProductsForCategoryListing(allProducts);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const slice = sorted.slice((page - 1) * limit, page * limit);
    return {
      products: slice,
      meta: { total, page, pageSize: limit, totalPages },
    };
  }
}

export async function getHomepageData(): Promise<{
  categories: Category[];
  products: Product[];
  featuredProducts: Product[];
  slides: CarouselSlide[];
  homepageText: HomepageText | null;
}> {
  try {
    const [categories, productsRaw, featuredRaw, content] = await Promise.all([
      fetchJson<Category[]>("/categories"),
      fetchJson<any[]>("/products"),
      fetchJson<any[]>("/products/featured?limit=8").catch(() => [] as any[]),
      fetchJson<{ id?: string; type: string; payload?: Record<string, unknown>; order?: number }[]>("/content"),
    ]);

    const products = productsRaw.map(mapProduct);
    const featuredProducts = (featuredRaw ?? []).map(mapProduct);

    const slides = content
      .filter((c) => c.type === "carousel")
      .slice(0, MAX_CAROUSEL_SLIDES)
      .map((c, index) => ({
        id: (c.id as string) || `slide-${index}`,
        title: (c.payload?.title as string) || "Slide",
        subtitle: (c.payload?.subtitle as string) || "",
        imageUrl: (c.payload?.imageUrl as string) || mockSlides[0].imageUrl,
        order: c.payload?.order !== undefined ? Number(c.payload.order) : (c.order ?? index),
        href:
          (c.payload?.href as string) ||
          (c.payload?.linkUrl as string) ||
          (c.payload?.url as string) ||
          undefined,
        ctaLabel: (c.payload?.ctaLabel as string) || undefined,
      })) as CarouselSlide[];

    const textBlock = content.find((c) => c.type === "homepage_text");
    const homepageText: HomepageText | null = textBlock
      ? {
        id: textBlock.id,
        headline: (textBlock.payload?.headline as string) || "",
        body: (textBlock.payload?.body as string) || "",
      }
      : null;

    return {
      categories: categories.length ? categories : mockCategories,
      products: products.length ? products : mockProducts,
      featuredProducts,
      slides: slides.length ? slides : mockSlides,
      homepageText,
    };
  } catch {
    return {
      categories: mockCategories,
      products: mockProducts,
      featuredProducts: [],
      slides: mockSlides,
      homepageText: null,
    };
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await fetchJson<Category[]>("/categories");
  } catch {
    return mockCategories;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await fetchJson<any[]>("/products");
    return products.map(mapProduct);
  } catch {
    return mockProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const product = await fetchJson<any>(`/products/${slug}`);
    return mapProduct(product);
  } catch {
    return mockProducts.find((p) => p.slug === slug);
  }
}

function cartAuthHeaders(guestCartId?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (guestCartId) headers["x-guest-cart-id"] = guestCartId;
  return headers;
}

export async function getCart(guestCartId?: string): Promise<{
  id?: string;
  items: { productId: string; quantity: number; priceCents: number; currency: string; name?: string; stock?: number }[];
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
}> {
  try {
    const res = await fetch(`${API_URL}/cart`, {
      headers: cartAuthHeaders(guestCartId),
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const cart = await res.json();

    if (!cart || !cart.items) {
      return { items: [], subtotal: 0, vat: 0, total: 0, currency: "EUR" };
    }

    const items = cart.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      priceCents: Math.round((item.productPrice || 0) * 100),
      currency: item.productCurrency || "EUR",
      name: item.productName || "Unknown Product",
      stock: item.productStock,
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.priceCents * item.quantity, 0);
    const vat = Math.round(subtotal * 0.2);

    return { id: cart.id, items, subtotal, vat, total: subtotal + vat, currency: "EUR" };
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return { items: [], subtotal: 0, vat: 0, total: 0, currency: "EUR" };
  }
}

export async function addToCart(productId: string, quantity: number, guestCartId?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...cartAuthHeaders(guestCartId) };

  const res = await fetch(`${API_URL}/cart/items`, {
    method: "POST",
    headers,
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add item to cart");
  }
  return res.json();
}

export async function updateCartItem(productId: string, quantity: number, guestCartId?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...cartAuthHeaders(guestCartId) };

  const res = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update item");
  }
  return res.json();
}

export async function removeCartItem(productId: string, guestCartId?: string): Promise<any> {
  const res = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: "DELETE",
    headers: cartAuthHeaders(guestCartId),
  });

  if (!res.ok) {
    throw new Error("Failed to remove item");
  }
  return res.json();
}

export async function applyPromoCode(code: string, orderTotal: number): Promise<{ discount: number; message: string }> {
  const res = await fetch(`${API_URL}/cart/promo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, orderTotal }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Invalid promo code");
  }
  return res.json();
}

// ... existing imports

export async function getUserAddresses(): Promise<any[]> {
  if (typeof window === "undefined") return [];
  const { authFetch } = await import("./auth");
  try {
    const res = await authFetch("/profile/addresses");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createUserAddress(address: any): Promise<any> {
  const { authFetch } = await import("./auth");
  const res = await authFetch("/profile/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create address (${res.status})`);
  }
  return res.json();
}

export async function createOrder(addressId: string): Promise<any> {
  const { authFetch } = await import("./auth");
  const res = await authFetch("/checkout", {
    method: "POST",
    body: JSON.stringify({ addressId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to create order (${res.status})`);
  }
  return res.json();
}

export async function confirmOrderPayment(orderId: string, paymentIntentId?: string): Promise<{ ok: true }> {
  const { authFetch } = await import("./auth");
  const res = await authFetch(`/checkout/${orderId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ paymentIntentId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to confirm order (${res.status})`);
  }
  return res.json();
}

export async function createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
  const res = await fetch(`${API_URL}/payment/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create payment intent");
  }
  return res.json();
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface OrderAddressDTO {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface OrderDTO {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  items: OrderItemDTO[];
  shippingAddress?: OrderAddressDTO;
  billingAddress?: OrderAddressDTO;
  paymentMethod?: string;
  paymentLast4?: string;
  paymentStatus?: string;
  statusHistory?: { status: OrderStatus; at: string }[];
  createdAt: string;
  updatedAt?: string;
}

export type OrdersByYear = Record<string, OrderDTO[]>;

export interface OrderFilters {
  year?: number;
  status?: string;
  search?: string;
}

export async function getOrders(filters: OrderFilters = {}): Promise<OrdersByYear> {
  const { authFetch } = await import("./auth");
  const qs = new URLSearchParams();
  if (filters.year) qs.set("year", String(filters.year));
  if (filters.status) qs.set("status", filters.status);
  if (filters.search) qs.set("search", filters.search);
  const query = qs.toString();
  const res = await authFetch(`/orders${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as OrdersByYear;
}

export async function getOrder(id: string): Promise<OrderDTO> {
  const { authFetch } = await import("./auth");
  const res = await authFetch(`/orders/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as OrderDTO;
}

export async function downloadOrderInvoice(id: string): Promise<void> {
  const { authFetch } = await import("./auth");
  const res = await authFetch(`/orders/${encodeURIComponent(id)}/invoice`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facture-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Chat (Llama) ───────────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  history?: { role: string; content: string }[],
): Promise<{ reply: string }> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    throw new Error("Failed to get chat response");
  }
  return res.json();
}
