export class Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    imageUrl?: string;
    order: number;
    isActive: boolean;
    translations?: Record<string, { name?: string; description?: string }>;

    constructor(partial: Partial<Category>) {
        Object.assign(this, partial);
    }
}
