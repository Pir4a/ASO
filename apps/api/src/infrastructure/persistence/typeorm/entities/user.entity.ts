import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type UserRole = 'customer' | 'admin';

@Entity({ name: 'users' })
@Unique(['email'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    passwordHash: string;

    @Column({ type: 'varchar', length: 20, default: 'customer' })
    role: UserRole;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @Column({ nullable: true })
    verificationToken?: string;

    @Column({ nullable: true })
    verificationTokenExpires?: Date;

    @Column({ name: 'password_reset_token', type: 'text', nullable: true })
    passwordResetToken: string | null;

    @Column({ name: 'password_reset_token_expires', type: 'timestamptz', nullable: true })
    passwordResetTokenExpires: Date | null;

    @Column({ name: 'pending_email', type: 'text', nullable: true })
    pendingEmail: string | null;

    @Column({ name: 'pending_email_token', type: 'text', nullable: true })
    pendingEmailToken: string | null;

    @Column({ name: 'pending_email_expires', type: 'timestamptz', nullable: true })
    pendingEmailExpires: Date | null;

    @Column({ nullable: true })
    stripeCustomerId?: string;

    @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
    mfaEnabled: boolean;

    @Column({ name: 'mfa_secret', type: 'text', nullable: true })
    mfaSecret: string | null;

    @Column({ name: 'mfa_backup_codes', type: 'jsonb', nullable: true })
    mfaBackupCodes: string[] | null;

    @Column({ name: 'refresh_token_hash', type: 'text', nullable: true })
    refreshTokenHash: string | null;

    @Column({ name: 'refresh_token_expires_at', type: 'timestamptz', nullable: true })
    refreshTokenExpiresAt: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
