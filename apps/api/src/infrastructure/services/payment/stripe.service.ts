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
            apiVersion: '2024-12-18.acacia' as any,
        });
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

    async createCustomer(email: string, name: string): Promise<string> {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
            });
            return customer.id;
        } catch (error) {
            console.error('Stripe createCustomer failed:', error);
            throw new InternalServerErrorException('Failed to create stripe customer');
        }
    }

    async createSetupIntent(stripeCustomerId: string): Promise<{ clientSecret: string }> {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: stripeCustomerId,
                payment_method_types: ['card'],
            });
            return { clientSecret: setupIntent.client_secret! };
        } catch (error) {
            console.error('Stripe createSetupIntent failed:', error);
            throw new InternalServerErrorException('Failed to create setup intent');
        }
    }

    async listPaymentMethods(stripeCustomerId: string): Promise<any[]> {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: stripeCustomerId,
                type: 'card',
            });
            return paymentMethods.data.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
            }));
        } catch (error) {
            console.error('Stripe listPaymentMethods failed:', error);
            return [];
        }
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        try {
            await this.stripe.paymentMethods.detach(paymentMethodId);
        } catch (error) {
            console.error('Stripe detachPaymentMethod failed:', error);
            throw new InternalServerErrorException('Failed to detach payment method');
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
