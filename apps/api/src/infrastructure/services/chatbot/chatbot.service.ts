import { Injectable } from '@nestjs/common';
import { SearchFAQsUseCase } from '../../../application/use-cases/faq/search-faqs.use-case';

export interface ChatbotResponse {
  message: string;
  type: 'text' | 'faq' | 'escalation' | 'order_help';
  faqId?: string;
  confidence?: number;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly searchFAQsUseCase: SearchFAQsUseCase) {}

  async processMessage(message: string, userId?: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase();

    // Check for order-related questions
    if (this.isOrderRelated(lowerMessage)) {
      return {
        message: "Je vois que vous avez une question concernant votre commande. Pouvez-vous me donner votre numéro de commande ou votre email pour que je puisse vous aider ?",
        type: 'order_help',
      };
    }

    // Check for escalation keywords
    if (this.shouldEscalate(lowerMessage)) {
      return {
        message: "Je comprends que c'est urgent. Laissez-moi vous mettre en contact avec un conseiller humain. Un moment s'il vous plaît...",
        type: 'escalation',
      };
    }

    // Search FAQs
    const faqs = await this.searchFAQsUseCase.execute(message);

    if (faqs.length > 0) {
      const bestMatch = faqs[0];
      return {
        message: bestMatch.answer,
        type: 'faq',
        faqId: bestMatch.id,
        confidence: 0.8, // Basic confidence score
      };
    }

    // Fallback responses
    const fallbackResponses = [
      "Je ne suis pas sûr de comprendre votre question. Pouvez-vous la reformuler ?",
      "Désolé, je n'ai pas trouvé d'information pertinente. Essayez de contacter notre support.",
      "Pour des questions complexes, je recommande de contacter notre équipe support.",
    ];

    return {
      message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      type: 'text',
    };
  }

  private isOrderRelated(message: string): boolean {
    const orderKeywords = [
      'commande', 'order', 'livraison', 'delivery', 'suivi', 'tracking',
      'facture', 'invoice', 'paiement', 'payment', 'remboursement', 'refund',
      'retour', 'return', 'échange', 'exchange'
    ];

    return orderKeywords.some(keyword => message.includes(keyword));
  }

  private shouldEscalate(message: string): boolean {
    const escalationKeywords = [
      'urgent', 'urgence', 'problème', 'problem', 'aide', 'help',
      'parler à quelqu\'un', 'speak to someone', 'conseiller', 'advisor',
      'humain', 'human', 'support'
    ];

    return escalationKeywords.some(keyword => message.includes(keyword));
  }

  getWelcomeMessage(): string {
    return `Bonjour ! Je suis l'assistant virtuel d'Althea Systems. 
Comment puis-je vous aider aujourd'hui ?

• Consultez nos produits médicaux
• Suivez votre commande
• Contactez le support
• Découvrez nos services

Tapez votre question ou sélectionnez une option ci-dessus.`;
  }
}