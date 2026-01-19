import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentGateway } from '../../../domain/gateways/payment.gateway';

@Injectable()
export class StripePaymentService implements PaymentGateway {
    private stripe: Stripe;

    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY not set. Payment will fail.');
        }
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
            apiVersion: '2024-12-18.acacia', // Using a recent known version or cast as any
        } as any);
    }

    async createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<{ clientSecret: string; id: string }> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects cents
                currency,
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                clientSecret: paymentIntent.client_secret!,
                id: paymentIntent.id,
            };
        } catch (error) {
            console.error('Stripe createPaymentIntent failed:', error);
            throw new InternalServerErrorException('Failed to create payment intent');
        }
    }

    async verifyPayment(paymentId: string): Promise<string> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
            return paymentIntent.status;
        } catch (error) {
            console.error('Stripe verifyPayment failed:', error);
            throw new InternalServerErrorException('Failed to verify payment');
        }
    }
}
