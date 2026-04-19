import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { Promotion } from '../infrastructure/persistence/typeorm/entities/promotion.entity';

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected. Seeding...');

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const contentRepo = AppDataSource.getRepository(ContentBlock);
  const userRepo = AppDataSource.getRepository(User);
  const promoRepo = AppDataSource.getRepository(Promotion);

  // ── Categories ───────────────────────────────────────────────
  const categories = [
    {
      slug: 'imagerie',
      name: 'Imaging & Diagnostics',
      description: 'MRI systems, CT scanners, ultrasound machines, and X-ray equipment for precise medical imaging.',
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      order: 1,
    },
    {
      slug: 'bloc',
      name: 'Surgical & Operating Room',
      description: 'Surgical instruments, anesthesia stations, operating lights, and sterile field equipment.',
      imageUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
      order: 2,
    },
    {
      slug: 'soins',
      name: 'Patient Monitoring',
      description: 'Vital sign monitors, pulse oximeters, ECG machines, and connected care devices.',
      imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      order: 3,
    },
    {
      slug: 'protection',
      name: 'Protective Equipment',
      description: 'Medical-grade gloves, masks, gowns, face shields, and isolation gear.',
      imageUrl: 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&w=800&q=80',
      order: 4,
    },
    {
      slug: 'mobilite',
      name: 'Mobility & Rehabilitation',
      description: 'Wheelchairs, walkers, orthopedic braces, and physiotherapy equipment.',
      imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      order: 5,
    },
  ];

  const createdCategories = await categoryRepo.save(categories);
  console.log(`✓ ${createdCategories.length} categories created`);

  const findCat = (slug: string) =>
    createdCategories.find((c) => c.slug === slug);

  // ── Products ─────────────────────────────────────────────────
  const products = [
    // Imaging & Diagnostics
    {
      sku: 'ALT-CT-500',
      slug: 'ct-500-scanner',
      name: 'CT 500 High-Resolution Scanner',
      description: 'Advanced 128-slice CT scanner with AI-assisted image reconstruction. Ultra-fast acquisition, low radiation dose. Ideal for emergency and routine diagnostics.',
      categoryId: findCat('imagerie')?.id,
      price: 125000.00,
      currency: 'EUR',
      stock: 3,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      featured: true,
      featuredOrder: 0,
    },
    {
      sku: 'ALT-US-300',
      slug: 'ultrasound-pro-300',
      name: 'UltraSound Pro 300',
      description: 'Portable ultrasound with 15" HD touchscreen, 3D/4D imaging capability. Battery-powered for bedside and field use. Includes cardiac, abdominal, and vascular probes.',
      categoryId: findCat('imagerie')?.id,
      price: 28500.00,
      currency: 'EUR',
      stock: 12,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      featured: true,
      featuredOrder: 1,
    },
    {
      sku: 'ALT-XR-100',
      slug: 'digital-xray-100',
      name: 'Digital X-Ray System 100',
      description: 'Ceiling-mounted digital radiography system with wireless flat-panel detector. Auto-exposure control and instant image preview.',
      categoryId: findCat('imagerie')?.id,
      price: 67000.00,
      currency: 'EUR',
      stock: 5,
      status: 'new' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
    },
    // Surgical & Operating Room
    {
      sku: 'ALT-BLOC-900',
      slug: 'bloc-900-station',
      name: 'Operating Station 900',
      description: 'Complete connected operating room station with integrated patient monitoring, surgical lighting, and instrument management. IoT-enabled for real-time traceability.',
      categoryId: findCat('bloc')?.id,
      price: 98000.00,
      currency: 'EUR',
      stock: 2,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
      featured: true,
      featuredOrder: 2,
    },
    {
      sku: 'ALT-ANES-400',
      slug: 'anesthesia-workstation-400',
      name: 'Anesthesia Workstation 400',
      description: 'Advanced anesthesia delivery system with electronic gas mixing, integrated ventilator, and 12" patient data display. Supports all common anesthetic agents.',
      categoryId: findCat('bloc')?.id,
      price: 45000.00,
      currency: 'EUR',
      stock: 7,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'ALT-SURG-KIT',
      slug: 'surgical-instrument-kit',
      name: 'Premium Surgical Instrument Kit',
      description: '127-piece stainless steel surgical instrument set. Includes scalpels, forceps, retractors, needle holders, and scissors. Autoclave-safe, CE-marked.',
      categoryId: findCat('bloc')?.id,
      price: 3200.00,
      currency: 'EUR',
      stock: 25,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    },
    // Patient Monitoring
    {
      sku: 'ALT-MON-200',
      slug: 'monitoring-200',
      name: 'Vital Monitor 200',
      description: 'Multi-parameter patient monitor: ECG, SpO2, NIBP, temperature, capnography. 15" color display with configurable alarm thresholds. Wired and wireless connectivity.',
      categoryId: findCat('soins')?.id,
      price: 8500.00,
      currency: 'EUR',
      stock: 18,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
      featured: true,
      featuredOrder: 3,
    },
    {
      sku: 'ALT-ECG-12',
      slug: 'ecg-12-lead',
      name: '12-Lead ECG Machine',
      description: 'Portable 12-lead electrocardiograph with automatic interpretation. Built-in thermal printer, USB export, and HL7 integration for hospital information systems.',
      categoryId: findCat('soins')?.id,
      price: 4200.00,
      currency: 'EUR',
      stock: 2,
      status: 'low_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
    // Protective Equipment
    {
      sku: 'ALT-MASK-N95',
      slug: 'n95-respirator-box',
      name: 'N95 Respirator Masks (Box of 50)',
      description: 'NIOSH-approved N95 particulate respirators. Fluid-resistant, adjustable nose clip, latex-free. Individually wrapped for hygiene.',
      categoryId: findCat('protection')?.id,
      price: 89.00,
      currency: 'EUR',
      stock: 500,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'ALT-GOWN-ISO',
      slug: 'isolation-gown-pack',
      name: 'Isolation Gowns Level 3 (Pack of 25)',
      description: 'AAMI Level 3 fluid-resistant isolation gowns. Full coverage, elastic cuffs, rear tie closure. Single-use, latex-free.',
      categoryId: findCat('protection')?.id,
      price: 125.00,
      currency: 'EUR',
      stock: 300,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
    // Mobility & Rehabilitation
    {
      sku: 'ALT-WC-ELITE',
      slug: 'wheelchair-elite',
      name: 'Wheelchair Elite Pro',
      description: 'Lightweight aluminum wheelchair with ergonomic seating, quick-release wheels, and foldable frame. Weight capacity: 130kg. Anti-tip rear wheels included.',
      categoryId: findCat('mobilite')?.id,
      price: 1850.00,
      currency: 'EUR',
      stock: 15,
      status: 'in_stock' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
    },
    {
      sku: 'ALT-BRACE-KNE',
      slug: 'knee-brace-adjustable',
      name: 'Adjustable Knee Brace (Medical Grade)',
      description: 'Hinged knee brace with adjustable ROM settings. Medical-grade neoprene, breathable lining. Suitable for post-operative rehabilitation and ligament injuries.',
      categoryId: findCat('mobilite')?.id,
      price: 145.00,
      currency: 'EUR',
      stock: 60,
      status: 'new' as const,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    },
  ];

  await productRepo.save(products);
  console.log(`✓ ${products.length} products created`);

  // ── Content Blocks ───────────────────────────────────────────
  const contentBlocks = [
    {
      type: 'homepage_text' as const,
      payload: {
        headline: 'Premium Medical Equipment, Delivered with Excellence',
        body: 'Your trusted partner for high-quality medical devices and equipment. ISO 13485 certified. Fast delivery across Europe.',
      },
      order: 1,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'New: Digital X-Ray System 100',
        subtitle: 'Ceiling-mounted digital radiography with instant image preview',
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        href: '/products/digital-xray-100',
        ctaLabel: 'Discover',
        order: 1,
      },
      order: 1,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'Operating Station 900',
        subtitle: 'Connected operating room with real-time traceability',
        imageUrl: 'https://images.unsplash.com/photo-1582719478248-5f3c0a1e01d8?auto=format&fit=crop&w=800&q=80',
        href: '/products/bloc-900-station',
        ctaLabel: 'See product',
        order: 2,
      },
      order: 2,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'Expert Support & Maintenance',
        subtitle: 'Dedicated account managers and 24/7 technical assistance',
        imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
        href: '/contact',
        ctaLabel: 'Contact us',
        order: 3,
      },
      order: 3,
    },
  ];

  await contentRepo.save(contentBlocks);
  console.log(`✓ ${contentBlocks.length} content blocks created`);

  // ── Promotions ───────────────────────────────────────────────
  const promotions = [
    {
      code: 'WELCOME10',
      type: 'percentage' as const,
      value: 10,
      minOrderAmount: 500,
      maxUsages: 100,
      currentUsages: 0,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      isActive: true,
    },
    {
      code: 'FREESHIP150',
      type: 'fixed' as const,
      value: 50,
      minOrderAmount: 1500,
      maxUsages: 200,
      currentUsages: 0,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-06-30'),
      isActive: true,
    },
  ];

  await promoRepo.save(promotions);
  console.log(`✓ ${promotions.length} promotions created`);

  // ── Admin User ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  await userRepo.save({
    email: 'admin@althea.local',
    passwordHash: adminPassword,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Althea',
    isVerified: true,
    isActive: true,
  });
  console.log('✓ Admin user created (admin@althea.local / admin123)');

  // ── Demo Customer ────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('customer123', 10);
  await userRepo.save({
    email: 'demo@althea.local',
    passwordHash: customerPassword,
    role: 'customer',
    firstName: 'Marie',
    lastName: 'Dupont',
    isVerified: true,
    isActive: true,
  });
  console.log('✓ Demo customer created (<demo@althea.local> / customer123)');

  console.log('\n🌱 Seed complete!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
