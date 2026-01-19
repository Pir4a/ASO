import { Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CartItem } from './cart-item.entity';

export type CartStatus = 'active' | 'merged' | 'ordered';

@Entity({ name: 'carts' })
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'active'
    })
    status: CartStatus;

    @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: true })
    items: CartItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
