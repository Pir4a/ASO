export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 10;

/** Helper: parse `page`/`size` from `searchParams`, clamped to valid ranges. */
export function resolvePagination(
    searchParams: Record<string, string | string[] | undefined> | undefined,
    totalItems: number,
    options?: { pageParam?: string; sizeParam?: string; defaultSize?: PageSize },
): { page: number; size: PageSize; totalPages: number; offset: number } {
    const pageParam = options?.pageParam ?? "page";
    const sizeParam = options?.sizeParam ?? "size";
    const defaultSize = options?.defaultSize ?? DEFAULT_PAGE_SIZE;

    const rawSize = Number(getParam(searchParams, sizeParam));
    const size: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawSize)
        ? (rawSize as PageSize)
        : defaultSize;

    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const rawPage = Number(getParam(searchParams, pageParam));
    const page = Number.isFinite(rawPage) && rawPage >= 1
        ? Math.min(Math.floor(rawPage), totalPages)
        : 1;

    return { page, size, totalPages, offset: (page - 1) * size };
}

function getParam(
    searchParams: Record<string, string | string[] | undefined> | undefined,
    key: string,
): string | undefined {
    const value = searchParams?.[key];
    if (Array.isArray(value)) return value[0];
    return value;
}
