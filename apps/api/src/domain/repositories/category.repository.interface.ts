import { Category } from '../entities/category.entity';

export interface CategoryRepository {
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    create(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    delete(id: string): Promise<void>;
    findBySlug(slug: string): Promise<Category | null>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CategoryRepository';
