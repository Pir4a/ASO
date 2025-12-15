import type { CarouselSlide, Category, Product } from "@bootstrap/types";

export const slides: CarouselSlide[] = [
  {
    id: "slide-1",
    title: "Imagerie médicale de précision",
    subtitle: "Mettez à jour vos équipements critiques",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    order: 1,
    href: "/categories/imagerie",
  },
  {
    id: "slide-2",
    title: "Bloc opératoire connecté",
    subtitle: "Intégration IoT et traçabilité",
    imageUrl: "https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80",
    order: 2,
    href: "/categories/bloc",
  },
  {
    id: "slide-3",
    title: "Maintenance proactive",
    subtitle: "Réduisez les arrêts critiques",
    imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
    order: 3,
    href: "/tools/contact",
  },
];

export const categories: Category[] = [
  {
    id: "cat-1",
    slug: "imagerie",
    name: "Imagerie",
    description: "IRM, scanners, échographes",
    imageUrl: slides[0].imageUrl,
    order: 1,
  },
  {
    id: "cat-2",
    slug: "bloc",
    name: "Bloc opératoire",
    description: "Monitoring, équipements critiques",
    imageUrl: slides[1].imageUrl,
    order: 2,
  },
  {
    id: "cat-3",
    slug: "soins",
    name: "Soins & monitoring",
    description: "Dispositifs connectés",
    imageUrl: slides[2].imageUrl,
    order: 3,
  },
];

export const topProducts: Product[] = [
  {
    id: "prod-1",
    sku: "ALT-CT-500",
    slug: "ct-500",
    name: "Scanner CT 500",
    description: "Scanner haute résolution",
    categoryId: "cat-1",
    priceCents: 12500000,
    currency: "EUR",
    status: "in_stock",
    thumbnailUrl: slides[0].imageUrl,
  },
  {
    id: "prod-2",
    sku: "ALT-MON-200",
    slug: "monitoring-200",
    name: "Monitoring Patient 200",
    description: "Monitoring multi-paramètres",
    categoryId: "cat-3",
    priceCents: 4200000,
    currency: "EUR",
    status: "low_stock",
    thumbnailUrl: slides[1].imageUrl,
  },
  {
    id: "prod-3",
    sku: "ALT-BLOC-900",
    slug: "bloc-900",
    name: "Station Bloc 900",
    description: "Bloc opératoire connecté",
    categoryId: "cat-2",
    priceCents: 9800000,
    currency: "EUR",
    status: "new",
    thumbnailUrl: slides[2].imageUrl,
  },
];

