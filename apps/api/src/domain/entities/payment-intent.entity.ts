export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'
  | 'payment_failed'
  | 'refunded'
  | 'unknown';

export class PaymentIntent {
  id: string;
  orderId: string;
  idempotencyKey: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PaymentIntent>) {
    Object.assign(this, partial);
  }
}
