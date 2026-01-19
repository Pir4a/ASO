import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

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
}
