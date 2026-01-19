import { categories as mockCategories, slides as mockSlides, topProducts as mockProducts } from "@/data/mock";
import type { Category, Product, CarouselSlide } from "@bootstrap/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}

export async function getHomepageData(): Promise<{
  categories: Category[];
  products: Product[];
  slides: CarouselSlide[];
}> {
  try {
    const [categories, products, content] = await Promise.all([
      fetchJson<Category[]>("/categories"),
      fetchJson<Product[]>("/products"),
      fetchJson<{ type: string; payload?: Record<string, unknown> }[]>("/content"),
    ]);

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
    return await fetchJson<Product[]>("/products");
  } catch {
    return mockProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    return await fetchJson<Product>(`/products/${slug}`);
  } catch {
    return mockProducts.find((p) => p.slug === slug);
  }
}

export async function getCart(): Promise<{
  items: { productId: string; quantity: number; priceCents: number; currency: string; name?: string }[];
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
}> {
  try {
    return await fetchJson("/cart");
  } catch {
    const items = mockProducts.slice(0, 2).map((p) => ({
      productId: p.id,
      quantity: 1,
      priceCents: p.priceCents,
      currency: p.currency,
      name: p.name,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const vat = Math.round(subtotal * 0.2);
    return { items, subtotal, vat, total: subtotal + vat, currency: "EUR" };
  }
}

export async function getOrders(): Promise<
  { id: string; totalCents: number; currency: string; status: string; createdAt: string }[]
> {
  try {
    return await fetchJson("/orders");
  } catch {
    return [
      {
        id: "CMD-2025-001",
        totalCents: 1520000,
        currency: "EUR",
        status: "processing",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

