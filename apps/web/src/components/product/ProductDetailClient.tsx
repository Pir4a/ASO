"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import type { Category, Product } from "@bootstrap/types";

interface ProductDetailClientProps {
  product: Product;
  category?: Category;
  relatedProducts: Product[];
}

function buildGalleryImages(product: Product): string[] {
  const urls = [...(product.galleryUrls ?? [])];
  if (product.thumbnailUrl) urls.unshift(product.thumbnailUrl);
  return [...new Set(urls.filter(Boolean))];
}

export function ProductDetailClient({ product, category, relatedProducts }: ProductDetailClientProps) {
  const images = buildGalleryImages(product);
  const outOfStock = product.status === "out_of_stock" || (product.stock !== undefined && product.stock <= 0);
  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
          <ProductImageGallery productName={product.name} images={images} />

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Produit</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{product.name}</h1>
            <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            <p className="text-sm text-slate-500">SKU : {product.sku}</p>
            {category && (
              <Link href={`/categories/${category.slug}`} className="inline-flex text-sm font-semibold text-primary hover:underline">
                {category.name}
              </Link>
            )}
            <p className="text-2xl font-bold text-primary">
              {(product.priceCents / 100).toFixed(2)} {product.currency}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {outOfStock ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Rupture de stock</span>
              ) : product.status === "low_stock" ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Stock faible</span>
              ) : (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">En stock</span>
              )}
            </div>

            <div className={`flex flex-wrap gap-2 pt-2 ${outOfStock ? "opacity-70" : ""}`}>
              {!outOfStock ? (
                <>
                  <AddToCartButton productId={product.id} productName={product.name} variant="primary" />
                  <BuyNowButton productId={product.id} productName={product.name} />
                </>
              ) : (
                <button type="button" disabled className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
                  Indisponible
                </button>
              )}
              <Link
                href="/contact"
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary hover:text-primary"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {hasSpecs && product.specs ? <ProductSpecs specs={product.specs} /> : null}

      <RelatedProducts products={relatedProducts} categoryName={category?.name} />
    </div>
  );
}
