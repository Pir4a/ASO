import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Promotion } from './promotion.entity';
import { User } from './user.entity';

/**
 * Tracks per-user promo code usage to enforce usage limits
 */
@Entity({ name: 'promo_code_usages' })
export class PromoCodeUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    promotionId: string;

    @ManyToOne(() => Promotion)
    @JoinColumn({ name: 'promotionId' })
    promotion: Promotion;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', nullable: true })
    orderId?: string;

    @CreateDateColumn()
    usedAt: Date;
}
