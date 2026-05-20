export type Locale = 'en' | 'fr' | 'ar' | 'he';

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
  /** VAT % (FR: 0, 5.5, 10, 20). */
  vatRate?: number;
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
  /**
   * Marks the slide as the carousel's "image principale" (CDC XVI.6).
   * Exactly one slide should be flagged at a time; the storefront surfaces
   * the principal slide first.
   */
  isPrincipal?: boolean;
}

export interface HomepageText {
  id?: string;
  headline: string;
  body: string;
}

