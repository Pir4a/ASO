export class Address {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  street: string;
  address2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;

  constructor(partial: Partial<Address>) {
    Object.assign(this, partial);
  }
}
