import { Product } from '../entities/product.entity';

export interface ProductSearchParams {
    search?: string;
    categoryId?: string;
    sortBy?: 'createdAt' | 'name' | 'price';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ProductRepository {
    findAll(): Promise<Product[]>;
    findById(id: string): Promise<Product | null>;
    findOneBySlug(slug: string): Promise<Product | null>;
    create(product: Product): Promise<Product>;
    findWithFilters(params: ProductSearchParams): Promise<PaginatedResult<Product>>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'ProductRepository';
