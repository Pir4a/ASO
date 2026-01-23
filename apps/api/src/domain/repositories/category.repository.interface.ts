import { Category } from '../entities/category.entity';

export interface CategoryRepository {
    findAll(): Promise<Category[]>;
    findAllAdmin(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    findByIdIncludingDeleted(id: string): Promise<Category | null>;
    findBySlug(slug: string): Promise<Category | null>;
    create(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    updateStatus(id: string, isActive: boolean): Promise<Category>;
    reorder(orderUpdates: { id: string; displayOrder: number }[]): Promise<void>;
    softDelete(id: string): Promise<void>;
    bulkUpdateStatus(ids: string[], isActive: boolean): Promise<void>;
    bulkSoftDelete(ids: string[]): Promise<void>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CategoryRepository';
