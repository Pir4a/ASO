export class Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    imageUrl?: string;
    order: number;
    isActive: boolean;

    constructor(partial: Partial<Category>) {
        Object.assign(this, partial);
    }
}
