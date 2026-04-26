import { Category } from './category.entity';

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';

/** French VAT rates (HT → TVA display / invoicing). */
export type ProductVatRate = 0 | 5.5 | 10 | 20;

export class Product {
    id: string;
    sku: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    /** VAT % applied to this product (FR: 20, 10, 5.5, 0). */
    vatRate: ProductVatRate;
    currency: string;
    stock: number;
    status: ProductStatus;
    thumbnailUrl?: string;
    featured: boolean;
    featuredOrder: number;
    listPriority: number;
    /** When false, the product is a draft and hidden from the public catalog. */
    published: boolean;
    galleryUrls?: string[];
    specs?: Record<string, string>;
    translations?: Record<string, { name?: string; description?: string }>;
    categoryId: string;
    category?: Category;

    constructor(partial: Partial<Product>) {
        Object.assign(this, partial);
    }
}
