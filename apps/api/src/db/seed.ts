import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';

async function seed() {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const contentRepo = AppDataSource.getRepository(ContentBlock);
  const userRepo = AppDataSource.getRepository(User);

  const categories = [
    {
      slug: 'imagerie',
      name: 'Imagerie',
      description: 'IRM, scanners, échographes',
      order: 1,
    },
    {
      slug: 'bloc',
      name: 'Bloc opératoire',
      description: 'Monitoring, équipements critiques',
      order: 2,
    },
    {
      slug: 'soins',
      name: 'Soins & monitoring',
      description: 'Dispositifs connectés',
      order: 3,
    },
  ];

  const createdCategories = await categoryRepo.save(categories);

  const findCat = (slug: string) =>
    createdCategories.find((c) => c.slug === slug);

  const products = [
    {
      sku: 'ALT-CT-500',
      slug: 'ct-500',
      name: 'Scanner CT 500',
      description: 'Scanner haute résolution',
      categoryId: findCat('imagerie')?.id,
      priceCents: 12500000,
      currency: 'EUR',
      status: 'in_stock' as const,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'ALT-MON-200',
      slug: 'monitoring-200',
      name: 'Monitoring Patient 200',
      description: 'Monitoring multi-paramètres',
      categoryId: findCat('soins')?.id,
      priceCents: 4200000,
      currency: 'EUR',
      status: 'low_stock' as const,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'ALT-BLOC-900',
      slug: 'bloc-900',
      name: 'Station Bloc 900',
      description: 'Bloc opératoire connecté',
      categoryId: findCat('bloc')?.id,
      priceCents: 9800000,
      currency: 'EUR',
      status: 'new' as const,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
  ];

  await productRepo.save(products);

  const contentBlocks = [
    {
      type: 'homepage_text' as const,
      payload: {
        headline: 'Refonte e-commerce Althea Systems',
        body: 'Mobile-first, SEO, performance <100ms.',
      },
      order: 1,
    },
  ];

  await contentRepo.save(contentBlocks);

  const adminPassword = await bcrypt.hash('admin123', 10);
  await userRepo.save({
    email: 'admin@althea.local',
    passwordHash: adminPassword,
    role: 'admin',
  });

  console.log('Seed finished');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
