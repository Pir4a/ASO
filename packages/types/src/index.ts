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
  thumbnailUrl?: string;
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
}

