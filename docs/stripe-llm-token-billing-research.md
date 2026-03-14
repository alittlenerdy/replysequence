# Stripe LLM Token Billing -- Research Summary

**Date:** 2026-03-14
**Author:** Claude (Research Agent)
**Context:** Evaluating Stripe's new LLM Token Billing for ReplySequence usage-based pricing

---

## 1. What Is Stripe LLM Token Billing?

Stripe LLM Token Billing is a new billing feature (announced March 2, 2026) that lets SaaS companies bill their customers for AI/LLM token consumption without building custom metering infrastructure.

**Core mechanics:**
- You set a **markup percentage** (e.g., 30%) on top of raw model costs
- Stripe **automatically syncs model pricing** from providers so your margins stay consistent even when providers change prices
- Usage is recorded through one of three methods:
  1. **Stripe AI Gateway** -- single API call handles both the model request and usage tracking
  2. **Partner integrations** -- Vercel, OpenRouter, Cloudflare
  3. **Self-reporting** -- via Stripe Meter API, Token Meter SDK (npm), or Vercel AI SDK (npm)
- Stripe generates invoices combining fixed subscription fees with metered token charges

**Supported pricing models:**
- Pure usage-based (pay-as-you-go)
- Credit packs and top-ups
- Fixed fee with included usage (e.g., $19/mo includes 50k tokens, then $X per additional 1k)
- Hybrid combinations of the above

## 2. Availability Status

| Detail | Status |
|--------|--------|
| Launch date | March 2, 2026 (preview) |
| Current status | **Private preview / experimental** |
| Access | Waitlist only |
| GA timeline | **Not announced** -- Stripe has not committed to a date |
| Expanded access | March 3, 2026 update added dynamic pricing and model selection |

This is explicitly labeled "experimental in nature" in Stripe's own documentation. Advanced features (cost tracking without billing, credit systems) require contacting the Stripe team directly.

## 3. Supported AI Providers

Stripe's documentation references "major providers" without publishing a definitive list. Based on reporting and partner references:

- **OpenAI** -- confirmed
- **Anthropic/Claude** -- confirmed (Anthropic is a major Stripe customer; early access users include companies using Anthropic models)
- **Google models** -- confirmed
- Additional providers accessible through partner gateways (OpenRouter supports 100+ models)

The Stripe AI Gateway approach appears model-agnostic -- you send the prompt and model selection, and Stripe routes and meters accordingly.

## 4. Integration with Existing Stripe Subscriptions

ReplySequence currently has:
- Stripe webhook handler (`/api/stripe/webhook/route.ts`)
- Checkout flow (`/api/stripe/create-checkout/route.ts`)
- Customer portal (`/api/stripe/create-portal-session/route.ts`)
- Three tiers: Free ($0), Pro ($19/mo), Team ($29/mo)
- Both monthly and annual billing intervals
- Free tier: 5 AI drafts/month; Pro/Team: unlimited

**How token billing layers in:**
- Token billing uses the existing Stripe Billing Meter API (`/v1/billing/meters`)
- Metered usage prices attach to subscriptions as additional line items
- Invoices automatically combine the fixed subscription fee + metered token charges
- Existing webhook handling for `invoice.paid` events would need minor extension to handle usage-based line items
- The Customer Portal continues to work for managing the base subscription

**Integration effort estimate:** Medium. The webhook handler and checkout flow already exist. You would need to:
1. Create a Meter in Stripe for token consumption
2. Report usage events when drafts are generated (via Meter API or SDK)
3. Create a metered Price attached to the meter
4. Add the metered price to subscriptions at checkout
5. Update the pricing page UI to reflect hybrid pricing

## 5. Pricing Model Analysis for ReplySequence

### Current Model
| Tier | Price | AI Drafts |
|------|-------|-----------|
| Free | $0/mo | 5/month |
| Pro | $19/mo | Unlimited |
| Team | $29/mo | Unlimited |

### Option A: Per-Draft Pricing (Simplest)
Charge per follow-up email draft generated, regardless of underlying token count.
- Example: $0.25-0.50 per draft on top of base subscription
- Pros: Easy for customers to understand; predictable
- Cons: Doesn't account for variable draft complexity; doesn't need Stripe token billing (simple meter works)

### Option B: Per-Token Pass-Through (Stripe Token Billing)
Pass through actual Claude API costs with markup.
- Example: 30-50% markup on raw Anthropic token costs
- Pros: Margins stay consistent; automatic price sync
- Cons: Customers don't think in tokens; confusing for non-technical users; requires Stripe AI Gateway or SDK integration

### Option C: Hybrid with Included Allowance (Recommended Future State)
Keep flat tiers but add usage-based overage.
- Example: Pro ($19/mo) includes 50 drafts, then $0.30/draft beyond that
- Pros: Predictable base revenue; captures value from power users; easy to explain
- Cons: Moderate implementation effort; need to decide on the right included allowance

### Option D: Credit-Based
Sell credit packs that map to drafts.
- Example: 100 credits = $20; 1 draft = 1-3 credits based on complexity
- Pros: Flexible; good for variable usage
- Cons: More complex UX; need credit management UI

## 6. Cost Analysis

ReplySequence's current Claude API costs per draft (estimated):
- Meeting transcript: ~2,000-8,000 input tokens
- Draft generation: ~500-2,000 output tokens
- At Claude 3.5 Sonnet pricing (~$3/M input, ~$15/M output): **$0.01-0.05 per draft**
- With a 5x markup, per-draft charge would be $0.05-0.25

At current "unlimited" pricing on Pro ($19/mo), a user generating 100 drafts/month costs you ~$1-5 in API fees. Margins are healthy. The risk is a power user generating 1,000+ drafts/month (costing $10-50 in API fees against $19 revenue).

---

## RECOMMENDATION

### Short answer: **Wait. Do not adopt Stripe LLM Token Billing now.**

### Reasoning:

1. **It is experimental and waitlist-only.** Building on a private preview feature for a product in beta launch is stacking risk on risk. If Stripe changes the API or pricing before GA, you would need to rework.

2. **Your current margins are fine.** At $0.01-0.05 per draft and $19/mo Pro pricing, even heavy users are profitable. The "unlimited" plan works at current scale.

3. **Your users are non-technical.** ReplySequence targets salespeople and account managers who think in meetings and follow-ups, not tokens. Token-level billing adds confusion for no user benefit.

4. **A simple meter solves the near-term need.** If you want to cap or charge for overages, Stripe's standard Meter API (which is GA and stable) handles per-draft metering without the experimental token billing feature.

### Recommended action plan:

| Timeframe | Action |
|-----------|--------|
| **Now** | No changes. Keep flat-tier pricing. Monitor usage patterns post-launch to identify power users. |
| **Q2 2026** | If you see users hitting 200+ drafts/month, implement a simple draft counter with Stripe's GA Meter API. Add a soft cap or overage pricing (Option C above). |
| **Q3 2026** | Re-evaluate Stripe Token Billing if it reaches GA. Consider adoption only if you add multi-model support (e.g., GPT + Claude) where automatic price sync across providers adds real value. |
| **Skip entirely if** | Your user base stays under ~500 users or average usage stays under 100 drafts/user/month. Flat pricing is simpler and sufficient. |

### What to build instead (if usage-based becomes necessary):

Use Stripe's existing GA Meter API to count drafts:
```
POST /v1/billing/meter_events
{
  "event_name": "draft_generated",
  "payload": {
    "stripe_customer_id": "cus_xxx",
    "value": "1"
  }
}
```
This is stable, documented, and does not require waitlist access.

---

## Sources

- [Stripe Docs: Billing for LLM Tokens](https://docs.stripe.com/billing/token-billing)
- [TechCrunch: Stripe wants to turn your AI costs into a profit center](https://techcrunch.com/2026/03/02/stripe-wants-to-turn-your-ai-costs-into-a-profit-center/)
- [PYMNTS: Stripe Thinks the Subscription Model Needs a Usage-Based Upgrade](https://www.pymnts.com/news/artificial-intelligence/2026/stripe-introduces-billing-tools-to-meter-and-charge-ai-usage/)
- [CreateWith: Stripe Expands Access to LLM Token Billing](https://www.createwith.com/tool/stripe/updates/stripe-expands-access-to-llm-token-billing-with-dynamic-updates)
- [Stripe Docs: Usage-Based Billing for AI Startups](https://docs.stripe.com/get-started/use-cases/usage-based-billing)
- [Stripe Docs: Meters API Reference](https://docs.stripe.com/api/billing/meter)
- [Stripe Docs: Pay-as-you-go Implementation Guide](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide)
