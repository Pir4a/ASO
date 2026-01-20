"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@bootstrap/types";
import { ArrowLeft, Check, ShieldCheck, Truck } from "lucide-react";

interface ProductDetailClientProps {
    product: Product;
    category?: Category;
}

const stockStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
    in_stock: { label: "En stock", variant: "success" },
    low_stock: { label: "Stock faible", variant: "warning" },
    out_of_stock: { label: "Rupture de stock", variant: "destructive" },
    new: { label: "Nouveau", variant: "success" },
};

export function ProductDetailClient({ product, category }: ProductDetailClientProps) {
    const stockStatus = stockStatusConfig[product.status] || stockStatusConfig.in_stock;

    return (
        <div className="animate-fade-in-up pb-12">
            {/* Breadcrumb / Back Link */}
            <div className="mb-8">
                <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 size-4" />
                    Retour au catalogue
                </Link>
            </div>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Product Image Stage */}
                <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 shadow-sm group">
                    {product.thumbnailUrl ? (
                        <Image
                            src={product.thumbnailUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <span className="sr-only">Image indisponible</span>
                            <div className="text-center">
                                <div className="mb-2 text-4xl">📷</div>
                                <p className="text-sm font-medium">Image à venir</p>
                            </div>
                        </div>
                    )}
                    {product.status === "new" && (
                        <div className="absolute top-4 left-4">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">
                                Nouveauté
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Product Info & Actions */}
                <div className="flex flex-col justify-center space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {category && (
                                <Link
                                    href={`/products?category=${category.id}`}
                                    className="text-sm font-semibold tracking-wide text-primary uppercase hover:underline"
                                >
                                    {category.name}
                                </Link>
                            )}
                            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                                {product.name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-3xl font-bold text-slate-900">
                                {(product.priceCents / 100).toFixed(2)} {product.currency}
                            </p>
                            <Badge variant={stockStatus.variant} className="text-xs px-2.5 py-0.5 pointer-events-none">
                                {stockStatus.label}
                            </Badge>
                        </div>

                        <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                            {product.description}
                        </p>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">Réf:</span> {product.sku}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {product.status !== "out_of_stock" ? (
                                <div className="flex-1">
                                    <AddToCartButton
                                        productId={product.id}
                                        productName={product.name}
                                        variant="primary"
                                    />
                                </div>
                            ) : (
                                <Button disabled variant="secondary" className="flex-1 w-full" size="lg">
                                    Indisponible
                                </Button>
                            )}
                            <Button variant="outline" size="lg" className="flex-1">
                                Demander un devis
                            </Button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-primary size-5" />
                                <span>Garantie 2 ans incluse</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="text-primary size-5" />
                                <span>Livraison rapide 24/48h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="text-primary size-5" />
                                <span>Service client dédié</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
