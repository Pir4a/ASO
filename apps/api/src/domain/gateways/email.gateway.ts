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
}

export const EMAIL_GATEWAY = 'EMAIL_GATEWAY';
