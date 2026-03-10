import { describe, it, expect, vi } from 'vitest';
import { analyzePainPoints, pickPostFormat, extractKeywords, deduplicateAgainstExisting } from '@/scripts/blog-agent/analyze';
import type { PainPoint } from '@/scripts/blog-agent/types';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      primaryKeyword: 'sales follow-up emails',
      secondaryKeywords: ['meeting follow-up', 'sales automation'],
      title: 'Why Sales Teams Waste Hours on Follow-Up Emails',
      slug: 'why-sales-teams-waste-hours-follow-up-emails',
      postFormat: 'problem-solution',
    }),
    inputTokens: 500,
    outputTokens: 100,
    stopReason: 'end_turn',
  }),
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
}));

const samplePainPoints: PainPoint[] = [
  {
    source: 'twitter',
    text: 'I spend 30 minutes after every sales call writing follow-up emails. There has to be a better way.',
    author: 'salesrep1',
    url: 'https://x.com/salesrep1/status/1',
    engagement: 45,
    timestamp: '2026-03-10T10:00:00Z',
  },
  {
    source: 'twitter',
    text: 'Our team tried Gong but the follow-up email feature is terrible. Looking for alternatives.',
    author: 'salesmanager2',
    url: 'https://x.com/salesmanager2/status/2',
    engagement: 30,
    timestamp: '2026-03-10T11:00:00Z',
  },
  {
    source: 'twitter',
    text: 'Meeting notes are useless if they dont turn into action items and emails automatically',
    author: 'founder3',
    url: 'https://x.com/founder3/status/3',
    engagement: 60,
    timestamp: '2026-03-10T09:00:00Z',
  },
];

describe('analyze', () => {
  describe('pickPostFormat', () => {
    it('returns comparison when pain points mention competitor tools', () => {
      const format = pickPostFormat([samplePainPoints[1]]);
      expect(format).toBe('comparison');
    });

    it('returns problem-solution for general frustrations', () => {
      const format = pickPostFormat([samplePainPoints[0]]);
      expect(format).toBe('problem-solution');
    });
  });

  describe('extractKeywords', () => {
    it('extracts relevant keywords from pain point text', () => {
      const keywords = extractKeywords(samplePainPoints);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.some(k => k.includes('follow-up') || k.includes('follow up'))).toBe(true);
    });
  });

  describe('deduplicateAgainstExisting', () => {
    it('filters out topics that match existing blog slugs', () => {
      const existingSlugs = ['hidden-cost-slow-meeting-follow-ups'];
      const topics = [
        { slug: 'hidden-cost-slow-meeting-follow-ups', title: 'duplicate' },
        { slug: 'new-unique-topic', title: 'new' },
      ];
      const filtered = deduplicateAgainstExisting(topics, existingSlugs);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('new-unique-topic');
    });
  });

  describe('analyzePainPoints', () => {
    it('returns null when no pain points provided', async () => {
      const result = await analyzePainPoints([]);
      expect(result).toBeNull();
    });

    it('returns an AnalyzedTopic from valid pain points', async () => {
      const result = await analyzePainPoints(samplePainPoints);
      expect(result).not.toBeNull();
      expect(result!.primaryKeyword).toBeTruthy();
      expect(result!.title).toBeTruthy();
      expect(result!.slug).toBeTruthy();
      expect(result!.postFormat).toMatch(/^(problem-solution|comparison)$/);
    });
  });
});
