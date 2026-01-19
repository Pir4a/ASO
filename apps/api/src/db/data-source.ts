import 'dotenv/config'; // Trigger rebuild
import { DataSource } from 'typeorm';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product, ContentBlock],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
