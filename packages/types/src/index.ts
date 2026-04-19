export type Locale = 'en' | 'fr' | 'ar';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  priceCents: number;
  currency: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
  stock?: number;
  thumbnailUrl?: string;
  featured?: boolean;
  featuredOrder?: number;
  /** BO listing priority on category pages (higher first). */
  listPriority?: number;
  /** Extra images for product gallery (thumbnailUrl is primary). */
  galleryUrls?: string[];
  /** Technical specifications (label → value). */
  specs?: Record<string, string>;
  /** Present when API loads product with category relation. */
  category?: { id: string; name: string; slug?: string };
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  order: number;
  href?: string;
  ctaLabel?: string;
}

export interface HomepageText {
  id?: string;
  headline: string;
  body: string;
}

