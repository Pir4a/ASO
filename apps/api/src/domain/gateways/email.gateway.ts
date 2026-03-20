export interface EmailGateway {
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendOrderConfirmationEmail(
        to: string,
        payload: {
            orderId: string;
            total: number;
            currency: string;
            items: Array<{ name: string; sku?: string; quantity: number; price: number }>;
            invoiceUrl?: string;
            customerName?: string;
        }
    ): Promise<void>;
    sendContactConfirmationEmail(to: string, name: string): Promise<void>;
    sendContactReplyEmail(to: string, name: string, subject: string, reply: string, originalMessage: string): Promise<void>;
}

export const EMAIL_GATEWAY = 'EMAIL_GATEWAY';
