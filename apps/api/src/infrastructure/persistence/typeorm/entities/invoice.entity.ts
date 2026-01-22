import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  pdfPath?: string;

  @Column({ type: 'jsonb', nullable: true })
  dataSnapshot?: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  history: Array<{ updatedAt: string; changes: Record<string, any> }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
