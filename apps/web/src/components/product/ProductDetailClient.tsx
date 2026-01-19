"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@bootstrap/types";

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
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-[2fr,1fr] md:items-start">
                        {/* Product Image */}
                        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-muted">
                            {product.thumbnailUrl ? (
                                <Image
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                                    Image à venir
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs uppercase text-muted-foreground">Produit</p>
                                <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
                                <p className="text-sm text-muted-foreground">{product.description}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">SKU : {product.sku}</p>
                                {category && (
                                    <Link
                                        href={`/categories/${category.slug}`}
                                        className="inline-block text-sm text-primary hover:underline"
                                    >
                                        {category.name}
                                    </Link>
                                )}
                            </div>

                            <p className="text-2xl font-bold text-primary">
                                {(product.priceCents / 100).toFixed(2)} {product.currency}
                            </p>

                            {/* Stock Status */}
                            <Badge variant={stockStatus.variant}>
                                {stockStatus.label}
                            </Badge>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {product.status !== "out_of_stock" ? (
                                    <AddToCartButton
                                        productId={product.id}
                                        productName={product.name}
                                        variant="primary"
                                    />
                                ) : (
                                    <Button disabled variant="secondary">
                                        Indisponible
                                    </Button>
                                )}
                                <Button variant="outline">
                                    Demander un devis
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
