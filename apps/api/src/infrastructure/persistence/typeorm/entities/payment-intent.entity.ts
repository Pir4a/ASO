import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'payment_intents' })
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  idempotencyKey: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  stripePaymentIntentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'varchar', length: 40, default: 'unknown' })
  status: string;

  @Column({ type: 'text' })
  clientSecret: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
