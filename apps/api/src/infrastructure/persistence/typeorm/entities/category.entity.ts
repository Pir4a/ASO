import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'categories' })
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    imageUrl?: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];
}
