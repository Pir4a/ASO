import { PaymentMethod } from '../entities/payment-method.entity';

export interface PaymentMethodRepository {
  findByUserId(userId: string): Promise<PaymentMethod[]>;
  findByProviderPaymentMethodId(providerPaymentMethodId: string): Promise<PaymentMethod | null>;
  create(paymentMethod: PaymentMethod): Promise<PaymentMethod>;
  deleteByProviderPaymentMethodId(providerPaymentMethodId: string): Promise<void>;
}

export const PAYMENT_METHOD_REPOSITORY_TOKEN = 'PaymentMethodRepository';
