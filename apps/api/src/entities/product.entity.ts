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
  @Column({ unique: true, nullable: false }) // Assurez-vous que le slug est non-nullable
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 }) // Utilisation de decimal pour le prix, avec une valeur par défaut
  price: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'int', default: 0, nullable: false }) // Ajout de la colonne stock
  stock: number;

  @Column({ type: 'varchar', length: 20, default: 'new', nullable: false }) // Définition d'un statut par défaut
  status: ProductStatus;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
