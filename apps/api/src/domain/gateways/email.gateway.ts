export interface EmailGateway {
    sendVerificationEmail(to: string, token: string): Promise<void>;
}

export const EMAIL_GATEWAY = 'EMAIL_GATEWAY';
