/**
 * Tests for Stripe webhook handler (app/api/stripe/webhook/route.ts)
 *
 * Covers: checkout.session.completed, invoice.payment_failed,
 * customer.subscription.deleted, and invalid signature handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (vi.mock factories cannot reference outer const, use vi.hoisted) ----

const {
  mockConstructEvent,
  mockSubscriptionsRetrieve,
  mockDbUpdateSetWhereReturning,
  mockDbSelectFromWhereLimit,
  mockDbUpdate,
  mockDbSelect,
  mockSendPaymentFailedEmail,
  mockSendSubscriptionPastDueEmail,
  mockSendSubscriptionCancelledEmail,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSubscriptionsRetrieve: vi.fn(),
  mockDbUpdateSetWhereReturning: vi.fn(),
  mockDbSelectFromWhereLimit: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockDbSelect: vi.fn(),
  mockSendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
  mockSendSubscriptionPastDueEmail: vi.fn().mockResolvedValue(undefined),
  mockSendSubscriptionCancelledEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  },
  STRIPE_PRICES: { pro: 'price_pro_monthly', team: 'price_team_monthly' },
  STRIPE_ANNUAL_PRICES: { pro: 'price_pro_annual', team: 'price_team_annual' },
}));

vi.mock('@/lib/db', () => ({
  db: {
    update: (...args: unknown[]) => mockDbUpdate(...args),
    select: (...args: unknown[]) => mockDbSelect(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { stripeCustomerId: 'stripeCustomerId', id: 'id', email: 'email', name: 'name', dunningEmailsSent: 'dunningEmailsSent', subscriptionTier: 'subscriptionTier', gracePeriodEndsAt: 'gracePeriodEndsAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/lib/dunning', () => ({
  sendPaymentFailedEmail: (...args: unknown[]) => mockSendPaymentFailedEmail(...args),
  sendSubscriptionPastDueEmail: (...args: unknown[]) => mockSendSubscriptionPastDueEmail(...args),
  sendSubscriptionCancelledEmail: (...args: unknown[]) => mockSendSubscriptionCancelledEmail(...args),
}));

vi.mock('@/lib/subscription', () => ({
  computeGracePeriodEnd: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

// ---- Helpers ----

function createWebhookRequest(body: string, signature = 'sig_test'): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
      'content-type': 'application/json',
    },
    body,
  });
}

function makeStripeEvent(type: string, data: unknown) {
  return {
    id: 'evt_test_123',
    type,
    livemode: false,
    data: { object: data },
  };
}

function setupDbChain(opts: {
  selectResults?: unknown[][];
  updateReturning?: unknown[];
}) {
  let selectCallIdx = 0;
  mockDbSelect.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => {
          const result = opts.selectResults?.[selectCallIdx] || [];
          selectCallIdx++;
          return Promise.resolve(result);
        }),
      })),
    })),
  }));

  mockDbUpdate.mockImplementation(() => ({
    set: vi.fn(() => ({
      where: vi.fn((arg?: unknown) => {
        // Some calls chain .returning(), some don't
        const returningVal = opts.updateReturning || [];
        return {
          returning: vi.fn().mockResolvedValue(returningVal),
          then: (resolve: (v: unknown) => void) => resolve(undefined),
        };
      }),
    })),
  }));
}

// ---- Tests ----

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkout.session.completed', () => {
    it('upgrades user subscription tier to pro', async () => {
      const session = {
        id: 'cs_test_123',
        customer: 'cus_test',
        subscription: 'sub_test',
        customer_email: 'user@example.com',
        client_reference_id: null,
      };

      mockConstructEvent.mockReturnValue(makeStripeEvent('checkout.session.completed', session));

      mockSubscriptionsRetrieve.mockResolvedValue({
        items: { data: [{ price: { id: 'price_pro_monthly' } }] },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      });

      setupDbChain({
        updateReturning: [{ id: 'user-1', email: 'user@example.com' }],
      });

      const request = createWebhookRequest(JSON.stringify(session));
      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ received: true });
      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_test');
      expect(mockDbUpdate).toHaveBeenCalled();
    });
  });

  describe('invoice.payment_failed', () => {
    it('sets grace period and sends dunning email on first failure', async () => {
      const invoice = {
        customer: 'cus_test',
        subscription: 'sub_test',
        amount_due: 1900,
        currency: 'usd',
        hosted_invoice_url: 'https://invoice.stripe.com/i/test',
      };

      mockConstructEvent.mockReturnValue(makeStripeEvent('invoice.payment_failed', invoice));

      setupDbChain({
        selectResults: [[{
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
          dunningEmailsSent: 0,
          gracePeriodEndsAt: null,
        }]],
      });

      const request = createWebhookRequest(JSON.stringify(invoice));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(
        { email: 'user@example.com', name: 'Test User' },
        {
          amount_due: 1900,
          currency: 'usd',
          hosted_invoice_url: 'https://invoice.stripe.com/i/test',
        },
      );
    });
  });

  describe('customer.subscription.deleted', () => {
    it('downgrades user to free tier and sends cancellation email', async () => {
      const subscription = {
        customer: 'cus_test',
        current_period_end: Math.floor(Date.now() / 1000),
      };

      mockConstructEvent.mockReturnValue(makeStripeEvent('customer.subscription.deleted', subscription));

      setupDbChain({
        selectResults: [[{
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
          dunningEmailsSent: 0,
          subscriptionTier: 'pro',
        }]],
        updateReturning: [{ id: 'user-1', email: 'user@example.com', name: 'Test User' }],
      });

      const request = createWebhookRequest(JSON.stringify(subscription));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(mockSendSubscriptionCancelledEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Test User',
      });
    });
  });

  describe('Invalid webhook signature', () => {
    it('returns 400 when signature verification fails', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createWebhookRequest('{}', 'bad_signature');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Webhook signature verification failed');
    });

    it('returns 400 when stripe-signature header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing signature');
    });
  });
});
