import { AppDataSource } from './data-source';
import { FAQ } from '../infrastructure/persistence/typeorm/entities/faq.entity';

const faqData = [
  {
    question: "Quels types d'équipements médicaux proposez-vous ?",
    answer: "Nous proposons une large gamme d'équipements médicaux : imagerie médicale (scanners, IRM), bloc opératoire (tables, lampes), soins et monitoring (moniteurs, défibrillateurs). Tous nos produits sont certifiés et conformes aux normes européennes.",
    order: 1,
  },
  {
    question: "Comment puis-je passer commande ?",
    answer: "Pour passer commande, créez un compte professionnel, ajoutez les produits à votre panier, puis validez votre commande. Un conseiller vous contactera pour finaliser la livraison et l'installation si nécessaire.",
    order: 2,
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer: "Les délais varient selon les produits : 24-48h pour les pièces détachées d'urgence, 1-2 semaines pour les équipements standards, et jusqu'à 8 semaines pour les équipements sur mesure. Contactez-nous pour un devis précis.",
    order: 3,
  },
  {
    question: "Proposez-vous des formations pour l'utilisation des équipements ?",
    answer: "Oui, nous proposons des formations complètes pour tous nos équipements : formation initiale à l'installation, formation utilisateurs, et maintenance préventive. Nos formateurs certifiés interviennent sur site.",
    order: 4,
  },
  {
    question: "Comment contacter le support technique ?",
    answer: "Notre support technique est disponible 24/7 : téléphone +33 1 23 45 67 89, email support@althea.local, ou via le chatbot sur notre site. Nos techniciens certifiés interviennent sous 4h en urgence.",
    order: 5,
  },
  {
    question: "Proposez-vous la location d'équipements ?",
    answer: "Oui, nous proposons des contrats de location flexible pour la plupart de nos équipements : location courte durée (1-3 mois), location moyenne durée (6-12 mois), ou location longue durée avec option d'achat.",
    order: 6,
  },
  {
    question: "Quelles sont vos conditions de paiement ?",
    answer: "Nous acceptons les paiements par virement bancaire, carte de crédit, et proposons des facilités de paiement jusqu'à 36 mois selon le montant. Un acompte de 30% est requis pour les commandes > 50 000€.",
    order: 7,
  },
  {
    question: "Vos équipements sont-ils garantis ?",
    answer: "Tous nos équipements sont garantis 2 ans pièces et main d'œuvre. Nous proposons également des contrats de maintenance étendus jusqu'à 5 ans, incluant les visites préventives et les interventions d'urgence.",
    order: 8,
  },
];

export async function seedFAQs() {
  try {
    const faqRepository = AppDataSource.getRepository(FAQ);

    console.log('🌱 Seeding FAQs...');

    for (const faq of faqData) {
      const existing = await faqRepository.findOne({
        where: { question: faq.question }
      });

      if (!existing) {
        const newFaq = faqRepository.create({
          ...faq,
          status: 'active',
          viewCount: 0,
          helpfulCount: 0,
        });
        await faqRepository.save(newFaq);
        console.log(`✓ Created FAQ: "${faq.question}"`);
      } else {
        console.log(`⚠ FAQ already exists: "${faq.question}"`);
      }
    }

    console.log('✅ FAQ seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    throw error;
  }
}