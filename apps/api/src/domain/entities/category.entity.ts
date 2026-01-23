export class Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    order?: number;
    displayOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(partial: Partial<Category>) {
        Object.assign(this, partial);
    }
}
