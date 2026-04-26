import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export type InvoiceStatus = 'paid' | 'cancelled';

@Entity({ name: 'invoices' })
@Index(['orderId'])
export class InvoiceOrm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 32, unique: true })
    number: string;

    @Column({ type: 'uuid' })
    orderId: string;

    @Column({ type: 'uuid', nullable: true })
    userId: string | null;

    @Column({ type: 'integer' })
    totalHtCents: number;

    @Column({ type: 'integer' })
    totalTvaCents: number;

    @Column({ type: 'integer' })
    totalTtcCents: number;

    @Column({ type: 'varchar', length: 3, default: 'EUR' })
    currency: string;

    @Column({ type: 'varchar', length: 16, default: 'paid' })
    status: InvoiceStatus;

    @Column({ type: 'timestamptz' })
    issuedAt: Date;

    @Column({ type: 'text', nullable: true })
    pdfUrl: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
