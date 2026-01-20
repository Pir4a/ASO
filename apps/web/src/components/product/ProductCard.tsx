"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: Product;
    className?: string;
}

const statusConfig: Record<Product["status"], { label: string; className: string }> = {
    in_stock: { label: "En stock", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    low_stock: { label: "Stock faible", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    out_of_stock: { label: "Rupture", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
    new: { label: "Nouveau", className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground" },
};

export function ProductCard({ product, className }: ProductCardProps) {
    const status = statusConfig[product.status];

    return (
        <div className={cn("group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)}>
            {/* Image Section */}
            <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
                {product.thumbnailUrl ? (
                    <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground font-medium">
                        Image indisponible
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm", status.className)}>
                        {status.label}
                    </span>
                </div>
            </Link>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-5">
                <Link href={`/products/${product.slug}`} className="group-hover:text-primary transition-colors">
                    <h3 className="font-heading text-lg font-bold leading-tight line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {product.sku}
                </p>

                <div className="mt-auto flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Prix HT</span>
                        <span className="text-xl font-bold text-foreground">
                            {(product.priceCents / 100).toFixed(2)} {product.currency}
                        </span>
                    </div>

                    {/* Add to Cart - Only visible on hover/focus for desktop to keep clean look, or always valid but subtle */}
                    <div className="opacity-100 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {product.status !== "out_of_stock" && (
                            <AddToCartButton
                                productId={product.id}
                                productName={product.name}
                                variant="icon"
                                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/25"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
