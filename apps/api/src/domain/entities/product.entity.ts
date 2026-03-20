import { Category } from './category.entity';

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';

export class Product {
    id: string;
    sku: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    stock: number;
    status: ProductStatus;
    thumbnailUrl?: string;
    imageUrls?: string[];
    specs?: Record<string, any>;
    displayOrder?: number;
    relatedProductIds?: string[];
    categoryId: string;
    category?: Category;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(partial: Partial<Product>) {
        Object.assign(this, partial);
    }
}

