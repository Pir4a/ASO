import { categories as mockCategories, slides as mockSlides, topProducts as mockProducts } from "@/data/mock";
import type { Category, Product, CarouselSlide } from "@bootstrap/types";

const API_URL = typeof window === 'undefined'
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
  // Backend returns 'price' (decimal/number in major unit), Frontend expects 'priceCents'
  if (p.price !== undefined && p.priceCents === undefined) {
    return {
      ...p,
      priceCents: Math.round(Number(p.price) * 100),
      currency: p.currency || "EUR",
    };
  }
  return p;
}

export async function getHomepageData(): Promise<{
  categories: Category[];
  products: Product[];
  slides: CarouselSlide[];
}> {
  try {
    const [categories, productsRaw, content] = await Promise.all([
      fetchJson<Category[]>("/categories"),
      fetchJson<any[]>("/products"),
      fetchJson<{ type: string; payload?: Record<string, unknown> }[]>("/content"),
    ]);

    const products = productsRaw.map(mapProduct);

    const slides =
      (content
        .filter((c) => c.type === "carousel")
        .map((c, index) => ({
          id: `slide-${index}`,
          title: (c.payload?.title as string) || "Slide",
          subtitle: (c.payload?.subtitle as string) || "",
          imageUrl: (c.payload?.imageUrl as string) || mockSlides[0].imageUrl,
          order: c.payload?.order ? Number(c.payload.order) : index,
        })) as CarouselSlide[]) || mockSlides;

    return {
      categories: categories.length ? categories : mockCategories,
      products: products.length ? products : mockProducts,
      slides: slides.length ? slides : mockSlides,
    };
  } catch {
    return { categories: mockCategories, products: mockProducts, slides: mockSlides };
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

export async function getCart(guestCartId?: string): Promise<{
  id?: string;
  items: { productId: string; quantity: number; priceCents: number; currency: string; name?: string; stock?: number }[];
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
}> {
  try {
    const headers: Record<string, string> = {};
    if (guestCartId) {
      headers['x-guest-cart-id'] = guestCartId;
    }

    const res = await fetch(`${API_URL}/cart`, {
      headers,
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
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (guestCartId) {
    headers['x-guest-cart-id'] = guestCartId;
  }

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
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (guestCartId) {
    headers['x-guest-cart-id'] = guestCartId;
  }

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
  const headers: Record<string, string> = {};
  if (guestCartId) {
    headers['x-guest-cart-id'] = guestCartId;
  }

  const res = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: "DELETE",
    headers,
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
  try {
    return await fetchJson("/profile/addresses");
  } catch {
    return [];
  }
}

export async function createUserAddress(address: any): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/profile/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    });
    if (!res.ok) throw new Error("Failed to create address");
    return res.json();
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function createOrder(addressId: string): Promise<any> {
  try {
    // Mock user ID for guest flow as handled in backend controller placeholder
    const res = await fetch(`${API_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "guest-user-id", addressId }),
    });
    if (!res.ok) throw new Error("Failed to create order");
    return res.json();
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function getOrders(): Promise<
  { id: string; total: number; currency: string; status: string; createdAt: string }[]
> {
  try {
    const orders = await fetchJson<any[]>("/orders");
    return orders.map(o => ({
      id: o.id,
      total: o.total, // Backend sends decimal
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt
    }));
  } catch {
    return [
      {
        id: "CMD-2025-001",
        total: 152.00,
        currency: "EUR",
        status: "processing",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

