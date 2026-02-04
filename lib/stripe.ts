import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Price IDs for ReplySequence products
// Live mode price IDs (production defaults)
export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1SxDkuS20m94FbvlxwB7a3pg',   // $19/mo - ReplySequence Pro
  team: process.env.STRIPE_TEAM_PRICE_ID || 'price_1SxDlNS20m94FbvlCOKIirQc', // $29/mo - ReplySequence Team
} as const;

export type PriceTier = keyof typeof STRIPE_PRICES;
