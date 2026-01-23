import { Product } from '../entities/product.entity';

export interface ProductSearchParams {
    search?: string;
    categoryId?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';
    availability?: 'in_stock' | 'out_of_stock';
    sortBy?: 'createdAt' | 'name' | 'price' | 'displayOrder';
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
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
    bulkUpdate(ids: string[], payload: Partial<Product>): Promise<void>;
    findWithFilters(params: ProductSearchParams): Promise<PaginatedResult<Product>>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'ProductRepository';
