// __tests__/scripts/blog-agent/scrape-twitter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapePainPoints, SEARCH_KEYWORDS, buildSearchQuery } from '@/scripts/blog-agent/scrape-twitter';
import type { PainPoint } from '@/scripts/blog-agent/types';

describe('scrape-twitter', () => {
  describe('buildSearchQuery', () => {
    it('combines keywords with OR and excludes retweets', () => {
      const query = buildSearchQuery(['meeting follow-up', 'CRM pain']);
      expect(query).toContain('meeting follow-up');
      expect(query).toContain('CRM pain');
      expect(query).toContain('-is:retweet');
      expect(query).toContain('lang:en');
    });
  });

  describe('SEARCH_KEYWORDS', () => {
    it('contains relevant sales/meeting keywords', () => {
      expect(SEARCH_KEYWORDS.length).toBeGreaterThan(3);
      expect(SEARCH_KEYWORDS.some(k => k.includes('follow-up') || k.includes('follow up'))).toBe(true);
    });
  });

  describe('scrapePainPoints', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns empty array when TWITTER_BEARER_TOKEN is not set', async () => {
      const originalEnv = process.env.TWITTER_BEARER_TOKEN;
      delete process.env.TWITTER_BEARER_TOKEN;
      const result = await scrapePainPoints();
      expect(result).toEqual([]);
      if (originalEnv) process.env.TWITTER_BEARER_TOKEN = originalEnv;
    });

    it('transforms Twitter API response into PainPoint array', async () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            text: 'I hate writing follow-up emails after every sales call',
            author_id: 'user1',
            created_at: '2026-03-10T10:00:00Z',
            public_metrics: { like_count: 15, retweet_count: 3, reply_count: 2, quote_count: 1 },
          },
        ],
        includes: {
          users: [{ id: 'user1', username: 'salesrep1' }],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      process.env.TWITTER_BEARER_TOKEN = 'test-token';
      const result = await scrapePainPoints();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        source: 'twitter',
        text: expect.stringContaining('follow-up emails'),
        author: 'salesrep1',
        engagement: 18, // 15 likes + 3 retweets
      });
    });
  });
});
