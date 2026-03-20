import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y';

@Entity({ name: 'promotions' })
export class Promotion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ type: 'varchar', length: 20 })
    type: PromotionType;

    @Column({ type: 'int' })
    value: number;

    @Column({ type: 'int', nullable: true })
    minOrderAmount?: number;

    @Column({ type: 'int', nullable: true })
    maxUsages?: number;

    @Column({ type: 'int', nullable: true })
    maxUsagesPerUser?: number;

    @Column({ type: 'int', default: 0 })
    currentUsages: number;

    @Column({ type: 'timestamp' })
    validFrom: Date;

    @Column({ type: 'timestamp' })
    validUntil: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
