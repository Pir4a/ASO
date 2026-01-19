export class Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    order: number;

    constructor(partial: Partial<Category>) {
        Object.assign(this, partial);
    }
}
