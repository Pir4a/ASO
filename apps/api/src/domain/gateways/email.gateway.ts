export interface EmailGateway {
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string, locale?: string): Promise<void>;
}

export const EMAIL_GATEWAY = 'EMAIL_GATEWAY';
