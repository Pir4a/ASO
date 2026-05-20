import { Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderStatusEvent = {
    status: OrderStatus;
    at: string;
    byUserId?: string | null;
    byEmail?: string | null;
};

@Entity({ name: 'orders' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Customer-facing identifier ALT-YYYYMMDD-XXXX. Nullable to allow backfill on existing rows. */
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 32, nullable: true })
    orderNumber: string | null;

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

    /** Promo code applied at order creation (`WELCOME10`, …); null when no discount. */
    @Column({ type: 'varchar', length: 64, nullable: true })
    promotionCode: string | null;

    /** Discount in the same unit as `total` (€). 0 / null when no promo. */
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountAmount: number | null;

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

    /** Set on first transition to a "paid" status (typically `processing`). */
    @Column({ type: 'timestamptz', nullable: true })
    paidAt: Date | null;

    @Column({ type: 'jsonb', nullable: true })
    statusHistory?: OrderStatusEvent[];

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
