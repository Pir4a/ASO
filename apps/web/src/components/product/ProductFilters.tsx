"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@bootstrap/types";
import { Search, SlidersHorizontal } from "lucide-react";

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
        <div className="flex flex-col gap-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                    name="search"
                    defaultValue={initialSearch}
                    placeholder="Rechercher un produit..."
                    className="pl-9 bg-white border-slate-200 focus-visible:ring-primary h-11 shadow-sm"
                />
            </form>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <SlidersHorizontal className="size-4" />
                    <span>Filtres :</span>
                </div>

                {/* Category Filter */}
                <select
                    value={initialCategory}
                    onChange={(e) => updateParams({ category: e.target.value })}
                    className="h-9 w-full sm:w-auto rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Sort */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Trier par:</span>
                    <select
                        value={initialSortBy}
                        onChange={(e) => updateParams({ sortBy: e.target.value })}
                        className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="createdAt">Nouveauté</option>
                        <option value="name">Nom</option>
                        <option value="price">Prix</option>
                    </select>
                    <select
                        value={initialSortOrder}
                        onChange={(e) => updateParams({ sortOrder: e.target.value })}
                        className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
