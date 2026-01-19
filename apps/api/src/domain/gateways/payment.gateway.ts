export interface PaymentGateway {
    createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<{ clientSecret: string; id: string }>;
    verifyPayment(paymentId: string): Promise<string>; // Returns status
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
