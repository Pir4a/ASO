export type UserRole = 'customer' | 'admin';

export class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
