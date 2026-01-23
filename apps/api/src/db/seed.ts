import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { seedFAQs } from './seed-faqs';

async function seed() {
  await AppDataSource.initialize();

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const contentRepo = AppDataSource.getRepository(ContentBlock);
  const userRepo = AppDataSource.getRepository(User);

  // Clean DB
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
  }

  const categories = [
    {
      slug: 'imagerie',
      name: 'Imagerie Médicale',
      description: 'IRM, scanners, échographes et équipements de radiologie',
      order: 1,
    },
    {
      slug: 'bloc',
      name: 'Bloc Opératoire',
      description: 'Équipements chirurgicaux, tables, éclairage et anesthésie',
      order: 2,
    },
    {
      slug: 'monitoring',
      name: 'Monitoring & Diagnostic',
      description: 'Surveillance patient, ECG, oxymètres et tensiomètres',
      order: 3,
    },
    {
      slug: 'mobilier',
      name: 'Mobilier & Confort',
      description: 'Lits médicalisés, brancards, chariots et mobilier de chambre',
      order: 4,
    },
    {
      slug: 'urgence',
      name: 'Urgence & Réanimation',
      description: 'Défibrillateurs, respirateurs et matériel de premiers secours',
      order: 5,
    },
  ];

  const createdCategories = await categoryRepo.save(categories);


  const findCat = (slug: string) =>
    createdCategories.find((c) => c.slug === slug);

  const products = [
    // Imagerie
    {
      sku: 'IMG-CT-500',
      slug: 'scanner-ct-500',
      name: 'Scanner CT 500 Haute Résolution',
      description: 'Scanner tomographique à rayons X de dernière génération offrant une qualité d\'image exceptionnelle pour un diagnostic précis. Idéal pour les examens oncologiques et cardio-vasculaires.',
      categoryId: findCat('imagerie')?.id,
      price: 125000.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 5,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'IMG-IRM-300',
      slug: 'irm-magnetom-300',
      name: 'IRM Magnetom 3.0T',
      description: 'Système d\'imagerie par résonance magnétique 3 Tesla. Silence accru, tunnel large pour le confort du patient. Applications avancées en neurologie.',
      categoryId: findCat('imagerie')?.id,
      price: 245000.00,
      currency: 'EUR',
      status: 'low_stock' as const,
      stock: 2,
      thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0a838be?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'IMG-ECHO-X1',
      slug: 'echographe-portable-x1',
      name: 'Échographe Portable X1',
      description: 'Échographe compact et polyvalent avec sondes interchangeables. Parfait pour les urgences et les visites au lit du patient.',
      categoryId: findCat('imagerie')?.id,
      price: 12500.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 15,
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    },
    // Bloc
    {
      sku: 'BLOC-TBL-PRO',
      slug: 'table-operation-pro',
      name: 'Table d\'Opération Pro-Surgical',
      description: 'Table électrique entièrement modulable pour toutes les disciplines chirurgicales. Supporte jusqu\'à 350kg avec radiotransparence totale.',
      categoryId: findCat('bloc')?.id,
      price: 18900.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 8,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'BLOC-LIGHT-LED',
      slug: 'scialytique-led-dual',
      name: 'Éclairage Scialytique LED Double',
      description: 'Système d\'éclairage chirurgical à double coupole. Lumière froide, sans ombre, avec réglage de la température de couleur.',
      categoryId: findCat('bloc')?.id,
      price: 8500.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 12,
      thumbnailUrl: 'https://plus.unsplash.com/premium_photo-1664475477169-46b784084d4e?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'BLOC-ANEST-Z5',
      slug: 'station-anesthesie-z5',
      name: 'Station d\'Anesthésie Z5',
      description: 'Station de travail d\'anesthésie complète avec ventilateur intégré et monitoring des gaz.',
      categoryId: findCat('bloc')?.id,
      price: 32000.00,
      currency: 'EUR',
      status: 'new' as const,
      stock: 4,
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=800&q=80',
    },
    // Monitoring
    {
      sku: 'MON-MULTI-200',
      slug: 'moniteur-patient-200',
      name: 'Moniteur Multiparamétrique MP-200',
      description: 'Surveillance continue ECG, SP02, NIBP, TEMP. Écran tactile 12 pouces haute visibilité.',
      categoryId: findCat('monitoring')?.id,
      price: 2450.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 45,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'MON-ECG-12',
      slug: 'electrocardiographe-12',
      name: 'Électrocardiographe 12 Pistes',
      description: 'ECG de repos avec analyse automatique et impression thermique. Connectivité WiFi pour export dossiers patients.',
      categoryId: findCat('monitoring')?.id,
      price: 1890.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 20,
      thumbnailUrl: 'https://plus.unsplash.com/premium_photo-1673958771960-e4450259cebc?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'MON-OXY-PORT',
      slug: 'oxymetre-pouls-pro',
      name: 'Oxymètre de Pouls Pro',
      description: 'Oxymètre de doigt robuste et précis pour usage intensif. Résistant aux chocs et aux liquides.',
      categoryId: findCat('monitoring')?.id,
      price: 125.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 150,
      thumbnailUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80',
    },
    // Mobilier
    {
      sku: 'MOB-BED-ELEC',
      slug: 'lit-hospitalisation-elec',
      name: 'Lit d\'Hospitalisation Électrique',
      description: 'Lit médicalisé 3 fonctions avec barrières latérales escamotables et matelas anti-escarres inclus.',
      categoryId: findCat('mobilier')?.id,
      price: 1500.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 30,
      thumbnailUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'MOB-CHAR-URG',
      slug: 'chariot-urgence-crash',
      name: 'Chariot d\'Urgence "Crash Cart"',
      description: 'Chariot d\'urgence entièrement équipé, verrouillable, avec support défibrillateur et planche de massage cardiaque.',
      categoryId: findCat('mobilier')?.id,
      price: 890.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 10,
      thumbnailUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    },
    // Urgence
    {
      sku: 'URG-DEFIB-AUTO',
      slug: 'defibrillateur-dsa',
      name: 'Défibrillateur Automatique DSA',
      description: 'DAE entièrement automatique pour utilisation par le grand public et les professionnels. Assistance vocale complète.',
      categoryId: findCat('urgence')?.id,
      price: 1100.00,
      currency: 'EUR',
      status: 'in_stock' as const,
      stock: 50,
      thumbnailUrl: 'https://plus.unsplash.com/premium_photo-1661604598165-27f67be3dc49?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'URG-RESP-TR',
      slug: 'respirateur-transport',
      name: 'Respirateur de Transport',
      description: 'Ventilateur d\'urgence compact et autonome pour le transport intra et extra-hospitalier.',
      categoryId: findCat('urgence')?.id,
      price: 6500.00,
      currency: 'EUR',
      status: 'low_stock' as const,
      stock: 3,
      thumbnailUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80',
    }
  ];

  await productRepo.save(products);

  const contentBlocks = [
    {
      type: 'homepage_text' as const,
      payload: {
        headline: 'Technologie Médicale de Pointe',
        body: 'Équipez votre établissement avec les meilleures solutions mondiales. Fiabilité, innovation et service premium.',
      },
      order: 1,
    },
  ];

  await contentRepo.save(contentBlocks);

  // Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await userRepo.save([
    {
      email: 'admin@althea.local',
      passwordHash: adminPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'System',
    },
    {
      email: 'user@althea.local',
      passwordHash: userPassword,
      role: 'customer',
      firstName: 'Jean',
      lastName: 'Dupont',
      isVerified: true
    }
  ]);

  // Seed FAQs
  await seedFAQs();

  console.log('Seed finished with ' + products.length + ' products, ' + categories.length + ' categories, and FAQs.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
