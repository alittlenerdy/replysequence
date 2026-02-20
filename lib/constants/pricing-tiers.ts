import { STRIPE_PRICES, STRIPE_ANNUAL_PRICES } from '@/lib/stripe-prices';

export interface PricingTier {
  name: string;
  tier: 'free' | 'pro' | 'team';
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  monthlyPriceId?: string;
  annualPriceId?: string;
  highlighted?: boolean;
  icon: 'zap' | 'sparkles' | 'building';
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    tier: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out ReplySequence',
    icon: 'zap',
    features: [
      'Unlimited meetings',
      'Basic email templates',
      'ReplySequence branding on emails',
      '5 AI drafts per month',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    tier: 'pro',
    monthlyPrice: 19,
    annualPrice: 15,
    description: 'For individuals who want more power',
    icon: 'sparkles',
    highlighted: true,
    monthlyPriceId: STRIPE_PRICES.pro,
    annualPriceId: STRIPE_ANNUAL_PRICES.pro,
    features: [
      'Everything in Free',
      'Unlimited AI drafts',
      'Custom email templates',
      'No ReplySequence branding',
      'Priority AI processing',
      'Advanced editing tools',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    tier: 'team',
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'For growing teams and agencies',
    icon: 'building',
    monthlyPriceId: STRIPE_PRICES.team,
    annualPriceId: STRIPE_ANNUAL_PRICES.team,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'CRM sync (Airtable, HubSpot)',
      'Team sharing & collaboration',
      'Analytics dashboard',
      'API access',
      'White-label exports',
      'Dedicated account manager',
    ],
  },
];
