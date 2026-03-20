"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@bootstrap/types";
import { Loader2 } from "lucide-react";

interface SimilarProductsProps {
    categoryId: string;
    currentProductId: string;
    limit?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function SimilarProducts({
    categoryId,
    currentProductId,
    limit = 4
}: SimilarProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilarProducts = async () => {
            try {
                // Fetch products from same category
                const res = await fetch(
                    `${API_URL}/products?category=${categoryId}&limit=${limit + 1}&sortBy=displayOrder`,
                    { cache: 'no-store' }
                );
                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                const items = Array.isArray(data) ? data : data.items || [];

                // Map prices and filter out current product, prioritize in-stock
                const mapped = items
                    .filter((p: any) => p.id !== currentProductId)
                    .map((p: any) => ({
                        ...p,
                        priceCents: p.priceCents || Math.round(Number(p.price) * 100),
                        currency: p.currency || "EUR",
                    }))
                    .sort((a: any, b: any) => {
                        // Prioritize in-stock items
                        if (a.status === 'out_of_stock' && b.status !== 'out_of_stock') return 1;
                        if (a.status !== 'out_of_stock' && b.status === 'out_of_stock') return -1;
                        return 0;
                    })
                    .slice(0, limit);

                setProducts(mapped);
            } catch (error) {
                console.error("Failed to fetch similar products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilarProducts();
    }, [categoryId, currentProductId, limit]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="mt-16 pt-12 border-t border-slate-200">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
                Produits similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
