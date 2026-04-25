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

  /** Localized fields per locale (e.g. { fr: { name, description } }). */
  @Column({ type: 'jsonb', nullable: true })
  translations?: Record<string, { name?: string; description?: string }>;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
