import type { Order } from '../entities/order.entity';

export interface SendOrderConfirmationOptions {
    locale?: string;
    invoiceNumber?: string;
    pdfBuffer?: Buffer;
}

export interface CreditNoteEmailContext {
    number: string;
    invoiceReference: string;
    amountTtc: number;
    currency: string;
    reason: string;
    issuedAt: Date;
}

export interface EmailGateway {
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string, locale?: string): Promise<void>;
    sendInvoiceEmail(
        to: string,
        invoiceNumber: string,
        pdfBuffer: Buffer,
        orderNumber?: string,
        locale?: string,
    ): Promise<void>;
    sendEmailChangeConfirmation(newEmail: string, token: string, locale?: string): Promise<void>;
    sendOrderConfirmation(
        to: string,
        order: Order,
        options?: SendOrderConfirmationOptions,
    ): Promise<void>;
    sendCreditNoteEmail(
        to: string,
        context: CreditNoteEmailContext,
        pdfBuffer: Buffer,
    ): Promise<void>;
    sendGuestSignupEmail(
        to: string,
        token: string,
        orderId: string,
        locale?: string,
    ): Promise<void>;
    sendChatReply(to: string, subject: string, content: string): Promise<void>;
    sendStockNotifyConfirmationEmail(
        to: string,
        productName: string,
        productSlug: string,
    ): Promise<void>;
    sendProductBackInStockEmail(
        to: string,
        productName: string,
        productSlug: string,
    ): Promise<void>;
}

export const EMAIL_GATEWAY = 'EMAIL_GATEWAY';
