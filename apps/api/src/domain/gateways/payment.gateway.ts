export interface PaymentMethodSummary {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

export interface CreatePaymentIntentOptions {
  metadata?: Record<string, string>;
  /** Stripe customer id — when set, saved cards show up in PaymentElement. */
  customerId?: string;
  /** When true, allows the card to be saved for future off_session payments. */
  setupFutureUsage?: boolean;
}

export interface PaymentGateway {
  createPaymentIntent(
    amount: number,
    currency: string,
    options?: CreatePaymentIntentOptions,
  ): Promise<{ clientSecret: string; id: string }>;
  createCustomer(email: string, name: string): Promise<string>;
  createSetupIntent(
    stripeCustomerId: string,
  ): Promise<{ clientSecret: string }>;
  listPaymentMethods(stripeCustomerId: string): Promise<PaymentMethodSummary[]>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(
    stripeCustomerId: string,
    paymentMethodId: string,
  ): Promise<void>;
  /** Retrieve a single payment method (used to capture brand+last4 after a successful intent). */
  retrievePaymentMethod(
    paymentMethodId: string,
  ): Promise<PaymentMethodSummary | null>;
  /** Retrieve a payment intent and (best-effort) the card details that authorized it. */
  retrievePaymentIntentCard(paymentIntentId: string): Promise<{
    paymentMethodId?: string;
    brand?: string;
    last4?: string;
    status: string;
  }>;
  verifyPayment(paymentId: string): Promise<string>; // Returns status
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
