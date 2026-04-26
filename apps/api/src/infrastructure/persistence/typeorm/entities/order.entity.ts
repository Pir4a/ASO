import { Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    userId: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'pending'
    })
    status: OrderStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @Column({ length: 3, default: 'EUR' })
    currency: string;

    @Column({ type: 'jsonb' })
    shippingAddress: any; // Storing as JSON snapshot for simplicity/robustness

    @Column({ type: 'jsonb', nullable: true })
    billingAddress?: any;

    @Column({ nullable: true })
    paymentMethod?: string;

    @Column({ nullable: true })
    paymentId?: string;

    /** Stripe payment-method id used (pm_…), so we can look up the card later. */
    @Column({ nullable: true })
    paymentMethodId?: string;

    @Column({ nullable: true, length: 32 })
    paymentBrand?: string;

    @Column({ nullable: true, length: 4 })
    paymentLast4?: string;

    @Column({ default: 'unpaid' })
    paymentStatus: string;

    @Column({ type: 'jsonb', nullable: true })
    statusHistory?: { status: OrderStatus; at: string }[];

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
