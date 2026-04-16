"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Category, Product } from "@bootstrap/types";

interface ProductDetailClientProps {
    product: Product;
    category?: Category;
}

export function ProductDetailClient({ product, category }: ProductDetailClientProps) {
    return (
        <div className="space-y-6">
            <div className="card p-6">
                <div className="grid gap-6 md:grid-cols-[2fr,1fr] md:items-start">
                    <div className="relative h-64 w-full overflow-hidden rounded-xl bg-background">
                        {product.thumbnailUrl ? (
                            <Image
                                src={product.thumbnailUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-foreground/60">
                                Image à venir
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs uppercase text-foreground/60">Produit</p>
                        <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
                        <p className="text-sm text-foreground/70">{product.description}</p>
                        <p className="text-sm text-foreground/60">SKU : {product.sku}</p>
                        {category && (
                            <Link href={`/categories/${category.slug}`} className="text-sm text-primary">
                                {category.name}
                            </Link>
                        )}
                        <p className="text-xl font-semibold text-primary">
                            {(product.priceCents / 100).toFixed(2)} {product.currency}
                        </p>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {product.status === "out_of_stock" ? (
                                <span className="rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-error">
                                    Rupture de stock
                                </span>
                            ) : product.status === "low_stock" ? (
                                <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
                                    Stock faible
                                </span>
                            ) : (
                                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                                    En stock
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            {product.status !== "out_of_stock" ? (
                                <AddToCartButton
                                    productId={product.id}
                                    productName={product.name}
                                    variant="primary"
                                />
                            ) : (
                                <button
                                    disabled
                                    className="rounded-md bg-foreground/30 px-4 py-2 text-sm font-semibold text-foreground/60 cursor-not-allowed"
                                >
                                    Indisponible
                                </button>
                            )}
                            <button className="rounded-md border border-primary/25 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                                Demander un devis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
