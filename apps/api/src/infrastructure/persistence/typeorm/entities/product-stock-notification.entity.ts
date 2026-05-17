import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'product_stock_notifications' })
@Index(['productId', 'email'], { unique: true })
export class ProductStockNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
