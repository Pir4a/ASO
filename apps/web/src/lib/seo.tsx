import type { Product, Category } from "@bootstrap/types";

interface JsonLdBase {
    "@context": "https://schema.org";
}

/**
 * Generate Product JSON-LD structured data
 */
export function generateProductJsonLd(product: Product, categoryName?: string): JsonLdBase & Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: product.sku,
        image: product.thumbnailUrl,
        brand: {
            "@type": "Brand",
            name: "Althea Systems",
        },
        category: categoryName,
        offers: {
            "@type": "Offer",
            url: `https://althea-systems.com/products/${product.slug}`,
            priceCurrency: product.currency || "EUR",
            price: (product.priceCents / 100).toFixed(2),
            availability: product.status === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : product.status === "low_stock"
                    ? "https://schema.org/LimitedAvailability"
                    : "https://schema.org/InStock",
            seller: {
                "@type": "Organization",
                name: "Althea Systems",
            },
        },
    };
}

/**
 * Generate Organization JSON-LD for the company
 */
export function generateOrganizationJsonLd(): JsonLdBase & Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Althea Systems",
        url: "https://althea-systems.com",
        logo: "https://althea-systems.com/logo.png",
        description: "Équipement médical professionnel de haute qualité pour les établissements de santé.",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+33-1-23-45-67-89",
            contactType: "customer service",
            availableLanguage: ["French", "English", "Arabic"],
        },
        sameAs: [
            "https://www.linkedin.com/company/althea-systems",
            "https://twitter.com/altheaSystems",
        ],
    };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdBase & Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate WebSite JSON-LD with search action
 */
export function generateWebsiteJsonLd(): JsonLdBase & Record<string, unknown> {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Althea Systems",
        url: "https://althea-systems.com",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: "https://althea-systems.com/products?search={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    };
}

/**
 * Render JSON-LD script tag
 */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data),
            }}
        />
    );
}
