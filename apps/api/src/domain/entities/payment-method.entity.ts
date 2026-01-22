export class PaymentMethod {
  id: string;
  userId: string;
  provider: string;
  providerPaymentMethodId: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PaymentMethod>) {
    Object.assign(this, partial);
  }
}
