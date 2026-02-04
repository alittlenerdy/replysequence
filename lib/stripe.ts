import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Price IDs from Stripe (verified via Stripe MCP)
export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1Sv2mDS20m94FbvlhyrmKVjv',
  team: process.env.STRIPE_TEAM_PRICE_ID || 'price_1Sv2oVS20m94FbvlLa8C69Bw',
} as const;

export type PriceTier = keyof typeof STRIPE_PRICES;
