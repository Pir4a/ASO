export interface PaymentGateway {
    createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<{ clientSecret: string; id: string }>;
    createCustomer(email: string, name: string): Promise<string>;
    createSetupIntent(stripeCustomerId: string): Promise<{ clientSecret: string }>;
    listPaymentMethods(stripeCustomerId: string): Promise<any[]>;
    detachPaymentMethod(paymentMethodId: string): Promise<void>;
    verifyPayment(paymentId: string): Promise<string>; // Returns status
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
