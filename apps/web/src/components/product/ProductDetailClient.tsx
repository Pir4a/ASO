"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { useT } from "@/context/LocaleContext";
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

function formatPrice(p: Product) {
  const value = p.priceCents / 100;
  return value >= 1000 ? value.toLocaleString("fr-FR") : value.toFixed(2);
}

export function ProductDetailClient({
  product,
  category,
  relatedProducts,
}: ProductDetailClientProps) {
  const t = useT();
  const images = buildGalleryImages(product);
  const outOfStock =
    product.status === "out_of_stock" || (product.stock !== undefined && product.stock <= 0);
  const lowStock =
    !outOfStock && (product.status === "low_stock" || (product.stock !== undefined && product.stock < 5));
  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;
  const stockCap = typeof product.stock === "number" && product.stock > 0 ? product.stock : 99;

  const [quantity, setQuantity] = useState(1);
  const clamp = (n: number) => Math.max(1, Math.min(stockCap, Math.floor(n)));

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav
        aria-label={t("auth.login.breadcrumbLabel")}
        className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
      >
        <Link href="/" className="hover:text-primary">
          {t("common.home")}
        </Link>
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <Link href="/products" className="hover:text-primary">
          {t("products.catalogTitle")}
        </Link>
        {category && (
          <>
            <span aria-hidden="true" className="text-foreground/25">/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-primary">
              {category.name}
            </Link>
          </>
        )}
        <span aria-hidden="true" className="text-foreground/25">/</span>
        <span className="font-semibold text-foreground">{product.name}</span>
      </nav>

      {/* Main: gallery + info */}
      <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-white">
        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:p-8">
          <ProductImageGallery productName={product.name} images={images} />

          <div className="flex flex-col gap-5">
            {category && (
              <Link
                href={`/categories/${category.slug}`}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
              >
                <span aria-hidden="true" className="block h-0.5 w-4 rounded-full bg-primary" />
                {category.name}
              </Link>
            )}

            <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-[34px]">
              {product.name}
            </h1>

            {product.sku && (
              <p className="font-mono text-[12px] text-foreground/55">RÉF · {product.sku}</p>
            )}

            <div className="flex items-baseline gap-3">
              <p className="font-heading text-[34px] font-bold leading-none tabular-nums text-foreground">
                {formatPrice(product)}
              </p>
              <p className="text-base font-medium text-foreground/55">{product.currency}</p>
              {product.vatRate !== undefined && product.vatRate !== null && (
                <p className="text-[12px] text-foreground/55">{t("cart.vat")} {product.vatRate}%</p>
              )}
            </div>

            {/* Stock state */}
            <div>
              {outOfStock ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-error/10 px-3 py-1.5 text-[13px] font-semibold text-error">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="m4.5 4.5 7 7" />
                  </svg>
                  {t("products.status.out_of_stock")}
                </span>
              ) : lowStock ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 text-[13px] font-semibold text-warning">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="M8 2.5 14 13H2L8 2.5Z" />
                    <path d="M8 7v3M8 11.5v.5" />
                  </svg>
                  {t("products.status.low_stock")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-[13px] font-semibold text-success">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="m3 8 3.5 3.5L13 5" />
                  </svg>
                  {t("products.status.in_stock")}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-[14.5px] leading-relaxed text-foreground/75">
                {product.description}
              </p>
            )}

            {/* CTA cluster */}
            <div className="mt-2 flex flex-col gap-3 border-t border-foreground/5 pt-5">
              {outOfStock ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-foreground/10 px-5 text-[15px] font-semibold text-foreground/55"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
                    <circle cx="8" cy="8" r="6" />
                    <path d="m4.5 4.5 7 7" />
                  </svg>
                  {t("products.status.out_of_stock")}
                </button>
              ) : (
                <>
                  <div className="flex flex-wrap items-stretch gap-2">
                    <div
                      className="flex h-12 items-stretch overflow-hidden rounded-lg border border-foreground/15 bg-white"
                      role="group"
                      aria-label={t("cart.qtyOf")}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => clamp(q - 1))}
                        disabled={quantity <= 1}
                        aria-label={t("cart.qtyDecrease")}
                        className="grid w-11 place-items-center text-foreground transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:text-foreground/30 disabled:hover:bg-transparent"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3.5 w-3.5">
                          <path d="M3 8h10" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={stockCap}
                        step={1}
                        value={quantity}
                        onChange={(e) => {
                          const n = Number.parseInt(e.target.value, 10);
                          if (Number.isFinite(n)) setQuantity(clamp(n));
                          else if (e.target.value === "") setQuantity(1);
                        }}
                        onBlur={(e) => {
                          const n = Number.parseInt(e.target.value, 10);
                          setQuantity(Number.isFinite(n) ? clamp(n) : 1);
                        }}
                        aria-label={t("cart.qtyOf")}
                        className="w-12 border-x border-foreground/10 bg-transparent text-center font-heading text-[15px] font-semibold text-foreground tabular-nums focus:outline-none focus:bg-background/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => clamp(q + 1))}
                        disabled={quantity >= stockCap}
                        aria-label={t("cart.qtyIncrease")}
                        className="grid w-11 place-items-center text-foreground transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:text-foreground/30 disabled:hover:bg-transparent"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-3.5 w-3.5">
                          <path d="M8 3v10M3 8h10" />
                        </svg>
                      </button>
                    </div>
                    <AddToCartButton
                      productId={product.id}
                      productName={product.name}
                      quantity={quantity}
                      variant="primary"
                      className="!h-12 !flex-1 !rounded-lg !px-5 !text-[15px]"
                    />
                  </div>
                  <BuyNowButton productId={product.id} productName={product.name} />
                </>
              )}
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-white px-5 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-3.5 w-3.5">
                  <rect x="2" y="3.5" width="12" height="9" rx="1" />
                  <path d="m2.5 4.5 5.5 4 5.5-4" />
                </svg>
                {t("contact.formSend")}
              </Link>
            </div>

            {/* Reassurance row */}
            <ul className="mt-2 grid grid-cols-3 gap-2 border-t border-foreground/5 pt-5 text-center" role="list">
              <li className="flex flex-col items-center gap-1.5 text-[11.5px] font-medium text-foreground/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5 text-primary">
                  <path d="M1 4h13v9H1V4Zm13 3h4l3 3v3h-7" />
                  <circle cx="5" cy="16" r="1.5" />
                  <circle cx="17" cy="16" r="1.5" />
                </svg>
                {t("cart.perkDelivery")}
              </li>
              <li className="flex flex-col items-center gap-1.5 text-[11.5px] font-medium text-foreground/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5 text-primary">
                  <path d="M12 2 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-5z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {t("cart.perkWarranty")}
              </li>
              <li className="flex flex-col items-center gap-1.5 text-[11.5px] font-medium text-foreground/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5 text-primary">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t("cart.perkSecurePayment")}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Specs */}
      {hasSpecs && product.specs ? <ProductSpecs specs={product.specs} /> : null}

      {/* Related */}
      <RelatedProducts
        products={relatedProducts}
        categoryName={category?.name}
        categorySlug={category?.slug}
      />
    </div>
  );
}
