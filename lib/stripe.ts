import Stripe from 'stripe';

// Re-export price constants so existing server-side imports still work
export { STRIPE_PRICES, STRIPE_ANNUAL_PRICES, type PriceTier, type BillingInterval } from './stripe-prices';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});
