"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        <div className="flex items-center justify-center gap-2 py-8">
            <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                asChild={currentPage !== 1}
            >
                {currentPage === 1 ? (
                    <ChevronLeft className="size-4" />
                ) : (
                    <Link href={createPageUrl(Math.max(1, currentPage - 1))}>
                        <ChevronLeft className="size-4" />
                    </Link>
                )}
            </Button>

            {pages.map((page) => (
                <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    asChild
                >
                    <Link href={createPageUrl(page)}>
                        {page}
                    </Link>
                </Button>
            ))}

            <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                asChild={currentPage !== totalPages}
            >
                {currentPage === totalPages ? (
                    <ChevronRight className="size-4" />
                ) : (
                    <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))}>
                        <ChevronRight className="size-4" />
                    </Link>
                )}
            </Button>
        </div>
    );
}
