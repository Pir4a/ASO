import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'addresses' })
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column()
    street: string;

    @Column({ nullable: true })
    address2?: string;

    @Column()
    city: string;

    @Column({ nullable: true })
    region?: string;

    @Column()
    postalCode: string;

    @Column()
    country: string;

    @Column({ nullable: true })
    phone?: string;
}
