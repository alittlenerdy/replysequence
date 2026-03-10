// __tests__/scripts/blog-agent/generate.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateBlogPost, buildSystemPrompt, calculateReadingTime } from '@/scripts/blog-agent/generate';
import type { AnalyzedTopic, VoicePreferences } from '@/scripts/blog-agent/types';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      excerpt: 'Test excerpt about follow-up emails.',
      content: Array(200).fill('Test content word').join(' '),
      tags: ['sales', 'follow-up'],
    }),
    inputTokens: 1000,
    outputTokens: 2000,
    stopReason: 'end_turn',
  }),
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
}));

describe('generate', () => {
  describe('calculateReadingTime', () => {
    it('calculates reading time at ~200 words per minute', () => {
      const words400 = Array(400).fill('word').join(' ');
      expect(calculateReadingTime(words400)).toBe(2);
    });

    it('rounds up partial minutes', () => {
      const words300 = Array(300).fill('word').join(' ');
      expect(calculateReadingTime(words300)).toBe(2);
    });

    it('returns minimum of 1 minute', () => {
      expect(calculateReadingTime('short')).toBe(1);
    });
  });

  describe('buildSystemPrompt', () => {
    it('includes voice preferences when provided', () => {
      const prefs: VoicePreferences = {
        aiTone: 'casual',
        aiCustomInstructions: 'Use short paragraphs',
        userRole: 'founder',
      };
      const prompt = buildSystemPrompt(prefs);
      expect(prompt).toContain('casual');
      expect(prompt).toContain('Use short paragraphs');
      expect(prompt).toContain('founder');
    });

    it('uses professional defaults when no prefs', () => {
      const prompt = buildSystemPrompt(null);
      expect(prompt).toContain('professional');
    });
  });

  describe('generateBlogPost', () => {
    it('returns a valid BlogDraft from analyzed topic', async () => {
      const topic: AnalyzedTopic = {
        painPoints: [],
        primaryKeyword: 'sales follow-up emails',
        secondaryKeywords: ['meeting follow-up'],
        postFormat: 'problem-solution',
        title: 'Why Sales Teams Waste Hours on Follow-Up Emails',
        slug: 'why-sales-teams-waste-hours-follow-up-emails',
      };

      const draft = await generateBlogPost(topic, null);
      expect(draft).not.toBeNull();
      expect(draft!.title).toBe(topic.title);
      expect(draft!.slug).toBe(topic.slug);
      expect(draft!.author).toBe('Jimmy Daly');
      expect(draft!.excerpt).toBeTruthy();
      expect(draft!.content).toBeTruthy();
      expect(draft!.tags.length).toBeGreaterThan(0);
      expect(draft!.readingTime).toBeGreaterThanOrEqual(1);
    });
  });
});
