import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/constants/stripe';

let stripeClient: Stripe | null = null;

/**
 * Cliente singleton del SDK de Stripe (backend).
 * Usa STRIPE_SECRET_KEY (sk_test_… en sandbox).
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      typescript: true,
    });
  }
  return stripeClient;
}
