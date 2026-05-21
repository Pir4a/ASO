/**
 * Locale resolution for incoming API requests.
 *
 * Order of precedence (first hit wins):
 *   1. Authenticated user's `preferredLocale` (when supplied)
 *   2. `?lang=` query parameter
 *   3. `Accept-Language` header (q-weight aware, best supported match)
 *   4. The provided `defaultLocale`
 *
 * Locales outside the supported set are ignored at each step.
 */

export const SUPPORTED_LOCALES = ['en', 'fr', 'ar', 'he'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES);

function normalize(tag: string): Locale | null {
    const base = tag.trim().toLowerCase().split(/[-_]/)[0];
    return SUPPORTED.has(base) ? (base as Locale) : null;
}

/** Parse an Accept-Language header into [(locale, q)] sorted by q desc. */
export function parseAcceptLanguage(header: string | undefined | null): Locale[] {
    if (!header) return [];
    const parts = header
        .split(',')
        .map((entry) => {
            const [rawTag, ...rest] = entry.trim().split(';');
            const qParam = rest.find((p) => p.trim().startsWith('q='));
            const q = qParam ? Number(qParam.split('=')[1]) : 1;
            return { tag: rawTag, q: Number.isFinite(q) ? q : 1 };
        })
        .filter((p) => p.tag);
    parts.sort((a, b) => b.q - a.q);
    const out: Locale[] = [];
    for (const p of parts) {
        const loc = normalize(p.tag);
        if (loc && !out.includes(loc)) out.push(loc);
    }
    return out;
}

interface ReqLike {
    query?: { lang?: unknown };
    headers?: Record<string, unknown>;
    user?: { preferredLocale?: unknown } | null;
}

export function resolveLocaleFromRequest(
    req: ReqLike,
    defaultLocale: Locale = DEFAULT_LOCALE,
): Locale {
    // 1. User-stored preference
    const userPref = req?.user?.preferredLocale;
    if (typeof userPref === 'string') {
        const loc = normalize(userPref);
        if (loc) return loc;
    }
    // 2. Query string ?lang=fr
    const q = req?.query?.lang;
    if (typeof q === 'string') {
        const loc = normalize(q);
        if (loc) return loc;
    }
    // 3. Accept-Language header
    const al = req?.headers?.['accept-language'];
    if (typeof al === 'string') {
        const accepted = parseAcceptLanguage(al);
        if (accepted.length) return accepted[0];
    }
    return defaultLocale;
}

/** Sanitize an externally-supplied locale (e.g. from a use-case argument). */
export function coerceLocale(value: unknown, fallback: Locale = DEFAULT_LOCALE): Locale {
    if (typeof value !== 'string') return fallback;
    return normalize(value) ?? fallback;
}
