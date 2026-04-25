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
    createSetupIntent(stripeCustomerId: string): Promise<{ clientSecret: string }>;
    listPaymentMethods(stripeCustomerId: string): Promise<PaymentMethodSummary[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<void>;
    setDefaultPaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<void>;
    verifyPayment(paymentId: string): Promise<string>; // Returns status
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
