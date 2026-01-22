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

    async createPaymentIntent(
        amount: number,
        currency: string,
        metadata?: any,
        idempotencyKey?: string
    ): Promise<{ clientSecret: string; id: string }> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create(
                {
                    amount: Math.round(amount * 100), // Stripe expects cents
                    currency,
                    metadata,
                    automatic_payment_methods: {
                        enabled: true,
                    },
                },
                idempotencyKey ? { idempotencyKey } : undefined
            );

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

    async createSetupIntent(stripeCustomerId: string, metadata?: any): Promise<{ clientSecret: string }> {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: stripeCustomerId,
                payment_method_types: ['card'],
                metadata,
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

    constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET not set');
        }
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

    async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; status: string }> {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined,
            });
            return { id: refund.id, status: refund.status || 'unknown' };
        } catch (error) {
            console.error('Stripe refundPayment failed:', error);
            throw new InternalServerErrorException('Failed to refund payment');
        }
    }

    async getPaymentMethodDetails(paymentMethodId: string): Promise<any> {
        try {
            const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
            return {
                id: paymentMethod.id,
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year,
            };
        } catch (error) {
            console.error('Stripe getPaymentMethodDetails failed:', error);
            throw new InternalServerErrorException('Failed to retrieve payment method');
        }
    }
}
