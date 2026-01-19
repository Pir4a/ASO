"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

const statusLabels: Record<Product["status"], string> = {
    in_stock: "En stock",
    low_stock: "Stock faible",
    out_of_stock: "Rupture",
    new: "Nouveau",
};

const statusColors: Record<Product["status"], string> = {
    in_stock: "bg-green-100 text-green-700",
    low_stock: "bg-yellow-100 text-yellow-700",
    out_of_stock: "bg-red-100 text-red-700",
    new: "bg-blue-100 text-blue-700",
};

export function ProductGridClient({ products }: { products: Product[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group relative rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                    <Link href={`/products/${product.slug}`}>
                        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-slate-50">
                            {product.thumbnailUrl ? (
                                <Image
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                    Image à venir
                                </div>
                            )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-foreground">{product.name}</p>
                                <p className="text-xs text-slate-500">{product.sku}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusColors[product.status]}`}>
                                {statusLabels[product.status]}
                            </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-primary">
                            {(product.priceCents / 100).toFixed(2)} {product.currency}
                        </p>
                    </Link>

                    {/* Add to Cart Button - only show if in stock */}
                    {product.status !== "out_of_stock" && (
                        <div className="mt-3">
                            <AddToCartButton
                                productId={product.id}
                                productName={product.name}
                                variant="small"
                                className="w-full"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
