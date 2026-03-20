"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@bootstrap/types";
import { Search, SlidersHorizontal, Filter } from "lucide-react";

interface ProductFiltersProps {
    categories: Category[];
    initialSearch: string;
    initialCategory: string;
    initialSortBy: string;
    initialSortOrder: string;
    initialMinPrice?: string;
    initialMaxPrice?: string;
    initialAvailability?: string;
}

export function ProductFilters({
    categories,
    initialSearch,
    initialCategory,
    initialSortBy,
    initialSortOrder,
    initialMinPrice = "",
    initialMaxPrice = "",
    initialAvailability = "",
}: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

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

    const handlePriceFilter = () => {
        // Convert EUR to cents (multiply by 100)
        const minCents = minPrice ? (parseFloat(minPrice) * 100).toString() : "";
        const maxCents = maxPrice ? (parseFloat(maxPrice) * 100).toString() : "";
        updateParams({ minPrice: minCents, maxPrice: maxCents });
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

                {/* Availability Filter */}
                <select
                    value={initialAvailability}
                    onChange={(e) => updateParams({ availability: e.target.value })}
                    className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <option value="">Toute disponibilité</option>
                    <option value="in_stock">En stock</option>
                    <option value="out_of_stock">Rupture de stock</option>
                </select>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Price Range Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />
                    <Input
                        type="number"
                        placeholder="Min €"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-9 w-20 text-sm"
                        min="0"
                        step="1"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="number"
                        placeholder="Max €"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-9 w-20 text-sm"
                        min="0"
                        step="1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePriceFilter}
                        className="h-9"
                    >
                        Appliquer
                    </Button>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Sort */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Trier par:</span>
                    <select
                        value={initialSortBy}
                        onChange={(e) => updateParams({ sortBy: e.target.value })}
                        className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="relevance">Pertinence</option>
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
