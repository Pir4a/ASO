import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Category } from '../entities/category.entity';

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';

@Entity({ name: 'products' })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ unique: true })
    sku!: string;

    @Index()
    @Column({ unique: true, nullable: false })
    slug!: string;

    @Column()
    name!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    price!: number;

    @Column({ length: 3, default: 'EUR' })
    currency!: string;

    @Column({ type: 'int', default: 0, nullable: false })
    stock!: number;

    @Column({ type: 'varchar', length: 20, default: 'new', nullable: false })
    status!: ProductStatus;

    @Column({ nullable: true })
    thumbnailUrl?: string;

    @Column({ type: 'jsonb', default: () => "'[]'" })
    imageUrls: string[];

    @Column({ type: 'jsonb', default: () => "'{}'" })
    specs: Record<string, any>;

    @Column({ type: 'int', default: 0 })
    displayOrder: number;

    @Column({ type: 'jsonb', default: () => "'[]'" })
    relatedProductIds: string[];

    @Column({ type: 'uuid' })
    categoryId!: string;

    @ManyToOne(() => Category, (category) => category.products, { eager: true })
    @JoinColumn({ name: 'categoryId' })
    category!: Category;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

