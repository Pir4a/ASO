export class Address {
    id: string;
    userId: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;

    constructor(partial: Partial<Address>) {
        Object.assign(this, partial);
    }
}
