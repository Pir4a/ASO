import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 30, default: 'stripe' })
  provider: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  providerPaymentMethodId: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  last4?: string;

  @Column({ type: 'int', nullable: true })
  expMonth?: number;

  @Column({ type: 'int', nullable: true })
  expYear?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
