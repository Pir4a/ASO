import { Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

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

    @Column({ default: 'unpaid' })
    paymentStatus: string;

    @Column({ type: 'timestamptz', nullable: true })
    paidAt?: Date;

    @Column({ nullable: true })
    refundId?: string;

    @Column({ type: 'timestamptz', nullable: true })
    refundedAt?: Date;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
