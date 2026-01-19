export type UserRole = 'customer' | 'admin';

export class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
