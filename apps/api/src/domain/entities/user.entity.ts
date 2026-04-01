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
    stripeCustomerId?: string;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
