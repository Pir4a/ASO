import { Product } from '../entities/product.entity';

export interface ProductRepository {
    findAll(): Promise<Product[]>;
    findById(id: string): Promise<Product | null>;
    findOneBySlug(slug: string): Promise<Product | null>;
    create(product: Product): Promise<Product>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'ProductRepository';
