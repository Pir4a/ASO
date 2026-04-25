import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Index,
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

    /** French VAT % (20, 10, 5.5, 0). */
    @Column({ type: 'decimal', precision: 4, scale: 1, default: 20 })
    vatRate!: number;

    @Column({ length: 3, default: 'EUR' })
    currency!: string;

    @Column({ type: 'int', default: 0, nullable: false })
    stock!: number;

    @Column({ type: 'varchar', length: 20, default: 'new', nullable: false })
    status!: ProductStatus;

    @Column({ nullable: true })
    thumbnailUrl?: string;

    @Column({ type: 'boolean', default: false, nullable: false })
    featured!: boolean;

    @Column({ type: 'int', default: 0, nullable: false })
    featuredOrder!: number;

    /** Listing order on category pages (BO); higher = first. */
    @Column({ type: 'int', default: 0, nullable: false })
    listPriority!: number;

    /** Extra product images for gallery (main visual may stay in thumbnailUrl). */
    @Column({ type: 'jsonb', nullable: true })
    galleryUrls?: string[];

    /** Structured technical specs (key → value). */
    @Column({ type: 'jsonb', nullable: true })
    specs?: Record<string, string>;

    /** Localized fields per locale (e.g. { fr: { name, description }, en: { ... } }). */
    @Column({ type: 'jsonb', nullable: true })
    translations?: Record<string, { name?: string; description?: string }>;

    @Column({ type: 'uuid' })
    categoryId!: string;

    @ManyToOne(() => Category, (category) => category.products, { eager: true })
    @JoinColumn({ name: 'categoryId' })
    category!: Category;
}
