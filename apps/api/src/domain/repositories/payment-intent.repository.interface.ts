import { PaymentIntent } from '../entities/payment-intent.entity';

export interface PaymentIntentRepository {
  findByIdempotencyKey(idempotencyKey: string): Promise<PaymentIntent | null>;
  findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentIntent | null>;
  create(paymentIntent: PaymentIntent): Promise<PaymentIntent>;
  update(paymentIntent: PaymentIntent): Promise<PaymentIntent>;
}

export const PAYMENT_INTENT_REPOSITORY_TOKEN = 'PaymentIntentRepository';
