import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'new';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  sku: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  status: ProductStatus;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
