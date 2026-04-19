import { Product } from '../entities/product.entity';

export interface ProductBrowseParams {
    categoryId?: string;
    categorySlug?: string;
    page: number;
    pageSize: number;
}

export interface ProductBrowseResult {
    items: Product[];
    total: number;
}

export interface ProductRepository {
    findAll(): Promise<Product[]>;
    findById(id: string): Promise<Product | null>;
    findOneBySlug(slug: string): Promise<Product | null>;
    create(product: Product): Promise<Product>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
    findFeatured(limit: number): Promise<Product[]>;
    browse(params: ProductBrowseParams): Promise<ProductBrowseResult>;
    findRelatedBySlug(slug: string, limit: number): Promise<Product[]>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'ProductRepository';
