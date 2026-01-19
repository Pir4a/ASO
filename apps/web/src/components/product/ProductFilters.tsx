"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@bootstrap/types";

interface ProductFiltersProps {
    categories: Category[];
    initialSearch: string;
    initialCategory: string;
    initialSortBy: string;
    initialSortOrder: string;
}

export function ProductFilters({
    categories,
    initialSearch,
    initialCategory,
    initialSortBy,
    initialSortOrder,
}: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            // Reset to page 1 when filters change
            params.delete("page");

            router.push(`/products?${params.toString()}`);
        },
        [router, searchParams]
    );

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get("search") as string;
        updateParams({ search });
    };

    return (
        <div className="space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                <Input
                    name="search"
                    defaultValue={initialSearch}
                    placeholder="Rechercher un produit..."
                    className="flex-1"
                />
                <Button type="submit">Rechercher</Button>
            </form>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Catégorie:</span>
                    <select
                        value={initialCategory}
                        onChange={(e) => updateParams({ category: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                        <option value="">Toutes</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Trier par:</span>
                    <select
                        value={initialSortBy}
                        onChange={(e) => updateParams({ sortBy: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                        <option value="createdAt">Date d&apos;ajout</option>
                        <option value="name">Nom</option>
                        <option value="price">Prix</option>
                    </select>
                    <select
                        value={initialSortOrder}
                        onChange={(e) => updateParams({ sortOrder: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
