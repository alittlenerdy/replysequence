import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Price IDs for ReplySequence products
export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1SxCXGS20m94FbvlGlnD0v02',
  team: process.env.STRIPE_TEAM_PRICE_ID || 'price_1SxCYaS20m94FbvligZE7tv5',
} as const;

export type PriceTier = keyof typeof STRIPE_PRICES;
