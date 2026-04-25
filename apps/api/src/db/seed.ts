import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { Category } from '../infrastructure/persistence/typeorm/entities/category.entity';
import { Product } from '../infrastructure/persistence/typeorm/entities/product.entity';
import { ContentBlock } from '../infrastructure/persistence/typeorm/entities/content-block.entity';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';
import { getInitialSeedUsers } from './seed-initial-users';
import { Promotion } from '../infrastructure/persistence/typeorm/entities/promotion.entity';

/**
 * Build an Unsplash CDN URL from a photo id, sized for product cards.
 * Each product gets its own unique image id below.
 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected. Seeding...');

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const contentRepo = AppDataSource.getRepository(ContentBlock);
  const userRepo = AppDataSource.getRepository(User);
  const promoRepo = AppDataSource.getRepository(Promotion);

  /* ── Categories ──────────────────────────────────────────── */
  const categories = [
    {
      slug: 'imaging-diagnostics',
      name: 'Imaging & Diagnostics',
      description:
        'MRI systems, CT scanners, ultrasound machines, and X-ray equipment for precise medical imaging.',
      imageUrl: img('1530497610245-94d3c16cda28'),
      order: 1,
      translations: {
        fr: {
          name: 'Imagerie & Diagnostics',
          description:
            'IRM, scanners CT, échographes et systèmes de radiographie numérique pour une imagerie médicale précise.',
        },
      },
    },
    {
      slug: 'surgical-operating-room',
      name: 'Surgical & Operating Room',
      description:
        'Surgical instruments, anesthesia stations, operating lights, and sterile field equipment.',
      imageUrl: img('1551601651-bc60f254d532'),
      order: 2,
      translations: {
        fr: {
          name: 'Bloc opératoire',
          description:
            "Instruments chirurgicaux, stations d'anesthésie, éclairages scialytiques et équipements stériles.",
        },
      },
    },
    {
      slug: 'patient-monitoring',
      name: 'Patient Monitoring',
      description:
        'Vital sign monitors, pulse oximeters, ECG machines, and connected care devices.',
      imageUrl: img('1576765608535-5f04d1e3f289'),
      order: 3,
      translations: {
        fr: {
          name: 'Monitoring patient',
          description:
            'Moniteurs multiparamètres, oxymètres de pouls, ECG et solutions de soins connectés.',
        },
      },
    },
    {
      slug: 'protective-equipment',
      name: 'Protective Equipment',
      description:
        'Medical-grade gloves, masks, gowns, face shields, and isolation gear.',
      imageUrl: img('1583912086096-8c60d75a53f9'),
      order: 4,
      translations: {
        fr: {
          name: 'Équipements de protection',
          description:
            "Gants médicaux, masques, blouses, écrans faciaux et équipements d'isolation.",
        },
      },
    },
    {
      slug: 'mobility-rehabilitation',
      name: 'Mobility & Rehabilitation',
      description:
        'Wheelchairs, walkers, orthopedic braces, and physiotherapy equipment.',
      imageUrl: img('1559757175-5700dde675bc'),
      order: 5,
      translations: {
        fr: {
          name: 'Mobilité & Rééducation',
          description:
            'Fauteuils roulants, déambulateurs, attelles orthopédiques et matériel de kinésithérapie.',
        },
      },
    },
  ];

  const createdCategories = await categoryRepo.save(categories);
  console.log(`✓ ${createdCategories.length} categories created`);

  const findCat = (slug: string) =>
    createdCategories.find((c) => c.slug === slug);

  /* ── Products ────────────────────────────────────────────── */
  const products = [
    // ── Imaging & Diagnostics ────────────────────────────
    {
      sku: 'ALT-IMG-501',
      slug: 'ct-500-high-resolution-scanner',
      name: 'CT 500 High-Resolution Scanner',
      description:
        'Advanced 128-slice CT scanner with AI-assisted image reconstruction. Ultra-fast acquisition, low radiation dose. Ideal for emergency and routine diagnostics.',
      categoryId: findCat('imaging-diagnostics')?.id,
      price: 125000.0,
      currency: 'EUR',
      stock: 3,
      status: 'in_stock' as const,
      thumbnailUrl: img('1530497610245-94d3c16cda28'),
      galleryUrls: [
        img('1530497610245-94d3c16cda28'),
        img('1582719478250-c89cae4dc85b'),
        img('1576091160550-2173dba999ef'),
      ],
      featured: true,
      featuredOrder: 0,
      listPriority: 100,
      specs: {
        Slices: '128',
        'Power supply': '380 V three-phase',
        'Dimensions (L×W×H)': '2.4 × 1.9 × 1.7 m',
        Certification: 'CE, FDA (class II)',
      },
      translations: {
        fr: {
          name: 'Scanner CT 500 Haute Résolution',
          description:
            "Scanner CT 128 coupes avec reconstruction d'image assistée par IA. Acquisition ultra-rapide, faible dose de radiation. Idéal pour le diagnostic en urgence et en routine.",
        },
      },
    },
    {
      sku: 'ALT-IMG-302',
      slug: 'ultrasound-pro-300',
      name: 'UltraSound Pro 300',
      description:
        'Portable ultrasound with 15" HD touchscreen, 3D/4D imaging capability. Battery-powered for bedside and field use. Includes cardiac, abdominal, and vascular probes.',
      categoryId: findCat('imaging-diagnostics')?.id,
      price: 28500.0,
      currency: 'EUR',
      stock: 12,
      status: 'in_stock' as const,
      thumbnailUrl: img('1576091160550-2173dba999ef'),
      galleryUrls: [
        img('1576091160550-2173dba999ef'),
        img('1530497610245-94d3c16cda28'),
      ],
      featured: true,
      featuredOrder: 1,
      listPriority: 80,
      specs: {
        Display: '15" HD touchscreen',
        Modes: '3D / 4D',
        'Battery life': 'Up to 4 h',
        Weight: '6.2 kg',
      },
      translations: {
        fr: {
          name: 'Échographe UltraSound Pro 300',
          description:
            'Échographe portable, écran tactile HD 15", imagerie 3D/4D. Sur batterie, utilisable au lit du patient et en intervention. Sondes cardiaque, abdominale et vasculaire incluses.',
        },
      },
    },
    {
      sku: 'ALT-IMG-101',
      slug: 'digital-x-ray-system-100',
      name: 'Digital X-Ray System 100',
      description:
        'Ceiling-mounted digital radiography system with wireless flat-panel detector. Auto-exposure control and instant image preview.',
      categoryId: findCat('imaging-diagnostics')?.id,
      price: 67000.0,
      currency: 'EUR',
      stock: 5,
      status: 'new' as const,
      thumbnailUrl: img('1551076805-e1869033e561'),
      listPriority: 60,
      translations: {
        fr: {
          name: 'Système de radiographie numérique 100',
          description:
            "Système de radiographie numérique au plafond avec détecteur plat sans fil. Contrôle d'exposition automatique et prévisualisation immédiate.",
        },
      },
    },
    {
      sku: 'ALT-IMG-410',
      slug: 'mammography-unit-vision-x',
      name: 'Mammography Unit Vision-X',
      description:
        'Full-field digital mammography with tomosynthesis option, low-dose detector and AI-assisted reading workflow.',
      categoryId: findCat('imaging-diagnostics')?.id,
      price: 89000.0,
      currency: 'EUR',
      stock: 0,
      status: 'out_of_stock' as const,
      thumbnailUrl: img('1582719478250-c89cae4dc85b'),
      translations: {
        fr: {
          name: 'Mammographe Vision-X',
          description:
            "Mammographe numérique plein champ avec option tomosynthèse, détecteur basse dose et workflow d'interprétation assisté par IA.",
        },
      },
    },

    // ── Surgical & Operating Room ────────────────────────
    {
      sku: 'ALT-SUR-900',
      slug: 'operating-station-900',
      name: 'Operating Station 900',
      description:
        'Complete connected operating room station with integrated patient monitoring, surgical lighting, and instrument management. IoT-enabled for real-time traceability.',
      categoryId: findCat('surgical-operating-room')?.id,
      price: 98000.0,
      currency: 'EUR',
      stock: 2,
      status: 'in_stock' as const,
      thumbnailUrl: img('1551601651-bc60f254d532'),
      galleryUrls: [
        img('1551601651-bc60f254d532'),
        img('1582719478248-5f3c0a1e01d8'),
      ],
      featured: true,
      featuredOrder: 2,
      listPriority: 90,
      translations: {
        fr: {
          name: 'Station opératoire 900',
          description:
            'Station de bloc opératoire connectée complète : monitoring patient intégré, éclairage chirurgical et gestion des instruments. Connectée IoT pour la traçabilité en temps réel.',
        },
      },
    },
    {
      sku: 'ALT-SUR-401',
      slug: 'anesthesia-workstation-400',
      name: 'Anesthesia Workstation 400',
      description:
        'Advanced anesthesia delivery system with electronic gas mixing, integrated ventilator, and 12" patient data display. Supports all common anesthetic agents.',
      categoryId: findCat('surgical-operating-room')?.id,
      price: 45000.0,
      currency: 'EUR',
      stock: 7,
      status: 'in_stock' as const,
      thumbnailUrl: img('1612277795421-9bc7706a4a34'),
      translations: {
        fr: {
          name: "Station d'anesthésie 400",
          description:
            'Station d\'anesthésie avancée avec mélangeur de gaz électronique, ventilateur intégré et écran patient 12". Compatible avec tous les agents anesthésiques courants.',
        },
      },
    },
    {
      sku: 'ALT-SUR-211',
      slug: 'premium-surgical-instrument-kit',
      name: 'Premium Surgical Instrument Kit',
      description:
        '127-piece stainless steel surgical instrument set. Includes scalpels, forceps, retractors, needle holders, and scissors. Autoclave-safe, CE-marked.',
      categoryId: findCat('surgical-operating-room')?.id,
      price: 3200.0,
      currency: 'EUR',
      stock: 25,
      status: 'in_stock' as const,
      thumbnailUrl: img('1582719478248-5f3c0a1e01d8'),
      translations: {
        fr: {
          name: 'Kit chirurgical Premium',
          description:
            'Set de 127 instruments chirurgicaux en acier inoxydable : scalpels, pinces, écarteurs, porte-aiguilles et ciseaux. Autoclavable, marqué CE.',
        },
      },
    },

    // ── Patient Monitoring ───────────────────────────────
    {
      sku: 'ALT-MON-200',
      slug: 'vital-monitor-200',
      name: 'Vital Monitor 200',
      description:
        'Multi-parameter patient monitor: ECG, SpO2, NIBP, temperature, capnography. 15" color display with configurable alarm thresholds. Wired and wireless connectivity.',
      categoryId: findCat('patient-monitoring')?.id,
      price: 8500.0,
      currency: 'EUR',
      stock: 18,
      status: 'in_stock' as const,
      thumbnailUrl: img('1576765608535-5f04d1e3f289'),
      featured: true,
      featuredOrder: 3,
      translations: {
        fr: {
          name: 'Moniteur Vital 200',
          description:
            'Moniteur patient multiparamètres : ECG, SpO2, PNI, température, capnographie. Écran couleur 15" avec seuils d\'alarme configurables. Connectivité filaire et sans fil.',
        },
      },
    },
    {
      sku: 'ALT-MON-120',
      slug: '12-lead-ecg-machine',
      name: '12-Lead ECG Machine',
      description:
        'Portable 12-lead electrocardiograph with automatic interpretation. Built-in thermal printer, USB export, and HL7 integration for hospital information systems.',
      categoryId: findCat('patient-monitoring')?.id,
      price: 4200.0,
      currency: 'EUR',
      stock: 2,
      status: 'low_stock' as const,
      thumbnailUrl: img('1631815589968-fdb09a223b1e'),
      translations: {
        fr: {
          name: 'Électrocardiographe 12 dérivations',
          description:
            'Électrocardiographe 12 dérivations portable avec interprétation automatique. Imprimante thermique intégrée, export USB et intégration HL7 pour les SIH.',
        },
      },
    },

    // ── Protective Equipment ─────────────────────────────
    {
      sku: 'ALT-EPI-095',
      slug: 'n95-respirator-masks-box',
      name: 'N95 Respirator Masks (Box of 50)',
      description:
        'NIOSH-approved N95 particulate respirators. Fluid-resistant, adjustable nose clip, latex-free. Individually wrapped for hygiene.',
      categoryId: findCat('protective-equipment')?.id,
      price: 89.0,
      vatRate: 5.5,
      currency: 'EUR',
      stock: 500,
      status: 'in_stock' as const,
      thumbnailUrl: img('1583912086096-8c60d75a53f9'),
      translations: {
        fr: {
          name: 'Masques respiratoires N95 (Boîte de 50)',
          description:
            "Masques particulaires N95 certifiés NIOSH. Résistants aux fluides, pince-nez ajustable, sans latex. Emballés individuellement pour l'hygiène.",
        },
      },
    },
    {
      sku: 'ALT-EPI-303',
      slug: 'isolation-gowns-level-3-pack',
      name: 'Isolation Gowns Level 3 (Pack of 25)',
      description:
        'AAMI Level 3 fluid-resistant isolation gowns. Full coverage, elastic cuffs, rear tie closure. Single-use, latex-free.',
      categoryId: findCat('protective-equipment')?.id,
      price: 125.0,
      vatRate: 5.5,
      currency: 'EUR',
      stock: 300,
      status: 'in_stock' as const,
      thumbnailUrl: img('1584516150909-c43483ee7932'),
      translations: {
        fr: {
          name: "Blouses d'isolation niveau 3 (Pack de 25)",
          description:
            "Blouses d'isolation AAMI niveau 3 résistantes aux fluides. Couverture complète, poignets élastiques, fermeture par lien arrière. Usage unique, sans latex.",
        },
      },
    },

    // ── Mobility & Rehabilitation ────────────────────────
    {
      sku: 'ALT-MOB-001',
      slug: 'wheelchair-elite-pro',
      name: 'Wheelchair Elite Pro',
      description:
        'Lightweight aluminum wheelchair with ergonomic seating, quick-release wheels, and foldable frame. Weight capacity: 130 kg. Anti-tip rear wheels included.',
      categoryId: findCat('mobility-rehabilitation')?.id,
      price: 1850.0,
      currency: 'EUR',
      stock: 15,
      status: 'in_stock' as const,
      thumbnailUrl: img('1559757175-5700dde675bc'),
      translations: {
        fr: {
          name: 'Fauteuil roulant Elite Pro',
          description:
            'Fauteuil roulant en aluminium léger, assise ergonomique, roues à démontage rapide et châssis pliant. Capacité 130 kg. Roulettes anti-bascule incluses.',
        },
      },
    },
    {
      sku: 'ALT-MOB-145',
      slug: 'adjustable-knee-brace',
      name: 'Adjustable Knee Brace (Medical Grade)',
      description:
        'Hinged knee brace with adjustable ROM settings. Medical-grade neoprene, breathable lining. Suitable for post-operative rehabilitation and ligament injuries.',
      categoryId: findCat('mobility-rehabilitation')?.id,
      price: 145.0,
      currency: 'EUR',
      stock: 60,
      status: 'new' as const,
      thumbnailUrl: img('1530026186672-2cd00ffc50fe'),
      translations: {
        fr: {
          name: 'Genouillère articulée (qualité médicale)',
          description:
            "Genouillère articulée avec réglage d'amplitude. Néoprène qualité médicale, doublure respirante. Adaptée à la rééducation post-opératoire et aux lésions ligamentaires.",
        },
      },
    },
  ];

  await productRepo.save(products);
  console.log(`✓ ${products.length} products created`);

  /* ── Content Blocks (homepage) ───────────────────────────── */
  const contentBlocks = [
    {
      type: 'homepage_text' as const,
      payload: {
        headline: 'Premium Medical Equipment, Delivered with Excellence',
        body: 'Your trusted partner for high-quality medical devices and equipment. ISO 13485 certified. Fast delivery across Europe.',
        translations: {
          fr: {
            headline: 'Équipement médical professionnel, livré avec excellence',
            body: 'Votre partenaire de confiance pour les dispositifs et équipements médicaux haut de gamme. Certifié ISO 13485. Livraison rapide partout en Europe.',
          },
        },
      },
      order: 1,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'New: Digital X-Ray System 100',
        subtitle:
          'Ceiling-mounted digital radiography with instant image preview',
        imageUrl: img('1551076805-e1869033e561'),
        href: '/products/digital-x-ray-system-100',
        ctaLabel: 'Discover',
        order: 1,
        translations: {
          fr: {
            title: 'Nouveau · Système de radiographie numérique 100',
            subtitle:
              'Radiographie numérique au plafond avec prévisualisation immédiate',
            ctaLabel: 'Découvrir',
          },
        },
      },
      order: 1,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'Operating Station 900',
        subtitle: 'Connected operating room with real-time traceability',
        imageUrl: img('1551601651-bc60f254d532'),
        href: '/products/operating-station-900',
        ctaLabel: 'See product',
        order: 2,
        translations: {
          fr: {
            title: 'Station opératoire 900',
            subtitle: 'Bloc opératoire connecté avec traçabilité en temps réel',
            ctaLabel: 'Voir le produit',
          },
        },
      },
      order: 2,
    },
    {
      type: 'carousel' as const,
      payload: {
        title: 'Expert Support & Maintenance',
        subtitle: 'Dedicated account managers and 24/7 technical assistance',
        imageUrl: img('1576091160550-2173dba999ef'),
        href: '/contact',
        ctaLabel: 'Contact us',
        order: 3,
        translations: {
          fr: {
            title: 'Support expert & maintenance',
            subtitle: 'Conseillers dédiés et assistance technique 24/7',
            ctaLabel: 'Nous contacter',
          },
        },
      },
      order: 3,
    },
  ];

  await contentRepo.save(contentBlocks);
  console.log(`✓ ${contentBlocks.length} content blocks created`);

  /* ── Promotions ──────────────────────────────────────────── */
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

  /* ── Users ───────────────────────────────────────────────── */
  const userSeed = getInitialSeedUsers();

  for (const u of userSeed) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = u.role;
      existing.firstName = u.firstName;
      existing.lastName = u.lastName;
      existing.isVerified = true;
      existing.isActive = true;
      await userRepo.save(existing);
      console.log(`✓ User updated: ${u.email} (${u.role})`);
    } else {
      await userRepo.save({
        email: u.email,
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        isVerified: true,
        isActive: true,
      });
      console.log(`✓ User created: ${u.email} (${u.role})`);
    }
  }

  console.log('\n🌱 Seed complete!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
