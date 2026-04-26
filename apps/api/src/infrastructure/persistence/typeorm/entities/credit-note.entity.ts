import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type CreditNoteReason = 'cancellation' | 'refund' | 'error';

@Entity({ name: 'credit_notes' })
export class CreditNoteOrm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 40 })
    number: string;

    @Index()
    @Column({ type: 'uuid' })
    invoiceId: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string | null;

    @Column({ type: 'integer' })
    amountTtcCents: number;

    @Column({ type: 'varchar', length: 3, default: 'EUR' })
    currency: string;

    @Column({ type: 'varchar', length: 20, default: 'cancellation' })
    reason: CreditNoteReason;

    @Column({ type: 'timestamptz', default: () => 'now()' })
    issuedAt: Date;

    @Column({ type: 'text', nullable: true })
    pdfUrl?: string | null;
}
