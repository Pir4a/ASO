export type UserRole = 'customer' | 'admin';

export class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    isVerified: boolean;
    isActive: boolean;
    lastLoginAt?: Date;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    passwordResetToken: string | null;
    passwordResetTokenExpires: Date | null;
    pendingEmail: string | null;
    pendingEmailToken: string | null;
    pendingEmailExpires: Date | null;
    /** TOTP second factor active for this user. */
    mfaEnabled: boolean;
    /** Base32-encoded TOTP secret. Returned only during the setup flow. */
    mfaSecret: string | null;
    /** Bcrypt-hashed single-use backup codes (8 of them). */
    mfaBackupCodes: string[] | null;
    /** Bcrypt-hashed refresh token — single slot per user (#37). */
    refreshTokenHash: string | null;
    refreshTokenExpiresAt: Date | null;
    stripeCustomerId?: string;
    createdAt?: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
