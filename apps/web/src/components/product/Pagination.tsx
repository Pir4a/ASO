"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        return `/products?${params.toString()}`;
    };

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <Link
                href={createPageUrl(Math.max(1, currentPage - 1))}
                className={`px-3 py-2 rounded-md border transition-colors ${currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "hover:bg-accent"
                    }`}
            >
                ←
            </Link>

            {pages.map((page) => (
                <Link
                    key={page}
                    href={createPageUrl(page)}
                    className={`px-3 py-2 rounded-md border transition-colors ${page === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                >
                    {page}
                </Link>
            ))}

            <Link
                href={createPageUrl(Math.min(totalPages, currentPage + 1))}
                className={`px-3 py-2 rounded-md border transition-colors ${currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "hover:bg-accent"
                    }`}
            >
                →
            </Link>
        </div>
    );
}
