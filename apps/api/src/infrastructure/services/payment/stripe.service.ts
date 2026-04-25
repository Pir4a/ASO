import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import {
    CreatePaymentIntentOptions,
    PaymentGateway,
    PaymentMethodSummary,
} from '../../../domain/gateways/payment.gateway';

function isValidStripeKey(key: string | undefined | null): key is string {
    if (!key) return false;
    const trimmed = key.trim();
    if (!trimmed) return false;
    if (trimmed === 'sk_test_mock') return false;
    // Placeholder like `sk_test_...` left from .env.example
    if (/\.{3,}$/.test(trimmed)) return false;
    return /^sk_(test|live)_[A-Za-z0-9]+/.test(trimmed);
}

@Injectable()
export class StripePaymentService implements PaymentGateway {
    private stripe: Stripe | null = null;
    private readonly misconfigMessage =
        'Stripe is not configured on the server. Set STRIPE_SECRET_KEY (from https://dashboard.stripe.com/test/apikeys) in the API environment and restart.';

    constructor() {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!isValidStripeKey(key)) {
            console.warn(
                '[StripePaymentService] STRIPE_SECRET_KEY is missing or looks like a placeholder. ' +
                'Payment endpoints will return 503 until a real test key is provided.',
            );
            return;
        }
        this.stripe = new Stripe(key, {
            apiVersion: '2024-12-18.acacia' as any,
        });
    }

    private requireStripe(): Stripe {
        if (!this.stripe) throw new ServiceUnavailableException(this.misconfigMessage);
        return this.stripe;
    }

    async createPaymentIntent(
        amount: number,
        currency: string,
        options: CreatePaymentIntentOptions = {},
    ): Promise<{ clientSecret: string; id: string }> {
        const stripe = this.requireStripe();
        try {
            const params: Stripe.PaymentIntentCreateParams = {
                amount: Math.round(amount * 100), // Stripe expects cents
                currency,
                metadata: options.metadata,
                automatic_payment_methods: { enabled: true },
            };
            if (options.customerId) params.customer = options.customerId;
            if (options.setupFutureUsage) params.setup_future_usage = 'off_session';

            const paymentIntent = await stripe.paymentIntents.create(params);

            return {
                clientSecret: paymentIntent.client_secret!,
                id: paymentIntent.id,
            };
        } catch (error: any) {
            console.error('Stripe createPaymentIntent failed:', error);
            const msg = error?.message || 'Failed to create payment intent';
            throw new InternalServerErrorException(`Stripe error: ${msg}`);
        }
    }

    async createCustomer(email: string, name: string): Promise<string> {
        const stripe = this.requireStripe();
        try {
            const customer = await stripe.customers.create({ email, name });
            return customer.id;
        } catch (error) {
            console.error('Stripe createCustomer failed:', error);
            throw new InternalServerErrorException('Failed to create stripe customer');
        }
    }

    async createSetupIntent(stripeCustomerId: string): Promise<{ clientSecret: string }> {
        const stripe = this.requireStripe();
        try {
            const setupIntent = await stripe.setupIntents.create({
                customer: stripeCustomerId,
                payment_method_types: ['card'],
            });
            return { clientSecret: setupIntent.client_secret! };
        } catch (error) {
            console.error('Stripe createSetupIntent failed:', error);
            throw new InternalServerErrorException('Failed to create setup intent');
        }
    }

    async listPaymentMethods(stripeCustomerId: string): Promise<PaymentMethodSummary[]> {
        if (!this.stripe) return [];
        try {
            const [paymentMethods, customer] = await Promise.all([
                this.stripe.paymentMethods.list({
                    customer: stripeCustomerId,
                    type: 'card',
                }),
                this.stripe.customers.retrieve(stripeCustomerId).catch(() => null),
            ]);
            const defaultPmId =
                customer && !('deleted' in customer)
                    ? (customer as Stripe.Customer).invoice_settings?.default_payment_method
                    : null;
            const defaultId =
                typeof defaultPmId === 'string' ? defaultPmId : defaultPmId?.id ?? null;
            return paymentMethods.data.map((pm) => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
                isDefault: pm.id === defaultId,
            }));
        } catch (error) {
            console.error('Stripe listPaymentMethods failed:', error);
            return [];
        }
    }

    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
        const stripe = this.requireStripe();
        try {
            await stripe.paymentMethods.detach(paymentMethodId);
        } catch (error) {
            console.error('Stripe detachPaymentMethod failed:', error);
            throw new InternalServerErrorException('Failed to detach payment method');
        }
    }

    async setDefaultPaymentMethod(
        stripeCustomerId: string,
        paymentMethodId: string,
    ): Promise<void> {
        const stripe = this.requireStripe();
        try {
            await stripe.customers.update(stripeCustomerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
            });
        } catch (error) {
            console.error('Stripe setDefaultPaymentMethod failed:', error);
            throw new InternalServerErrorException('Failed to set default payment method');
        }
    }

    async retrievePaymentMethod(paymentMethodId: string): Promise<PaymentMethodSummary | null> {
        if (!this.stripe || !paymentMethodId) return null;
        try {
            const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);
            return {
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
            };
        } catch (error) {
            console.error('Stripe retrievePaymentMethod failed:', error);
            return null;
        }
    }

    async retrievePaymentIntentCard(paymentIntentId: string): Promise<{
        paymentMethodId?: string;
        brand?: string;
        last4?: string;
        status: string;
    }> {
        if (!this.stripe) return { status: 'unknown' };
        try {
            const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ['payment_method'],
            });
            const pm = intent.payment_method;
            const card =
                pm && typeof pm === 'object' && 'card' in pm ? pm.card ?? undefined : undefined;
            const pmId = typeof pm === 'string' ? pm : pm?.id;
            return {
                status: intent.status,
                paymentMethodId: pmId,
                brand: card?.brand,
                last4: card?.last4,
            };
        } catch (error) {
            console.error('Stripe retrievePaymentIntentCard failed:', error);
            return { status: 'unknown' };
        }
    }

    async verifyPayment(paymentId: string): Promise<string> {
        const stripe = this.requireStripe();
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
            return paymentIntent.status;
        } catch (error) {
            console.error('Stripe verifyPayment failed:', error);
            throw new InternalServerErrorException('Failed to verify payment');
        }
    }
}
