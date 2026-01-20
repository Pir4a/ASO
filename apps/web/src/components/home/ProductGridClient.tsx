"use client";

import { Product } from "@bootstrap/types";
import { ProductCard } from "@/components/product/ProductCard";

export function ProductGridClient({ products }: { products: Product[] }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
