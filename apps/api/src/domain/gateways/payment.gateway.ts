export interface PaymentGateway {
    createPaymentIntent(
        amount: number,
        currency: string,
        metadata?: any,
        idempotencyKey?: string
    ): Promise<{ clientSecret: string; id: string }>;
    createCustomer(email: string, name: string): Promise<string>;
    createSetupIntent(stripeCustomerId: string, metadata?: any): Promise<{ clientSecret: string }>;
    listPaymentMethods(stripeCustomerId: string): Promise<any[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<void>;
    verifyPayment(paymentId: string): Promise<string>; // Returns status
    constructWebhookEvent(payload: Buffer | string, signature: string): any;
    refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; status: string }>;
    getPaymentMethodDetails(paymentMethodId: string): Promise<any>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
