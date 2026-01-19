import { Category } from '../entities/category.entity';

export interface CategoryRepository {
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CategoryRepository';
