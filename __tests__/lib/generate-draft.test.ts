/**
 * Tests for draft generation helpers
 *
 * Since generateDraft() is heavily dependent on the database and Claude API,
 * we test the supporting modules directly:
 * - Meeting type detection (lib/meeting-type-detector.ts)
 * - Quality scoring (lib/quality-scorer.ts)
 * - Retry logic classification (isRetryableError pattern)
 *
 * These are the pure-logic components that don't require mocking external services.
 */

import { describe, it, expect } from 'vitest';
import {
  detectMeetingType,
  extractParticipants,
  type MeetingType,
} from '@/lib/meeting-type-detector';
import {
  scoreDraft,
  getQualityGrade,
  meetsQualityThreshold,
  type QualityScore,
} from '@/lib/quality-scorer';
import type { ParsedDraftResponse } from '@/lib/prompts/optimized-followup';
import {
  SAMPLE_SALES_TRANSCRIPT,
  SAMPLE_INTERNAL_TRANSCRIPT,
  SAMPLE_TECHNICAL_TRANSCRIPT,
} from '../helpers';

// ============================================
// Meeting Type Detection
// ============================================

describe('detectMeetingType', () => {
  describe('detects sales calls', () => {
    it('identifies sales-related keywords', () => {
      const result = detectMeetingType(SAMPLE_SALES_TRANSCRIPT);

      expect(result.meetingType).toBe('sales_call');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.signals.length).toBeGreaterThan(0);
    });

    it('detects sales signals like pricing, demo, proposal', () => {
      const result = detectMeetingType(SAMPLE_SALES_TRANSCRIPT);

      // At least some sales-specific signals should appear
      const salesSignals = ['pricing', 'demo', 'proposal', 'trial', 'proof of concept', 'contract', 'decision maker', 'stakeholder'];
      const hasRelevantSignal = result.signals.some(s =>
        salesSignals.some(ss => s.toLowerCase().includes(ss))
      );
      expect(hasRelevantSignal).toBe(true);
    });
  });

  describe('detects internal syncs', () => {
    it('identifies internal meeting keywords', () => {
      const result = detectMeetingType(SAMPLE_INTERNAL_TRANSCRIPT);

      expect(result.meetingType).toBe('internal_sync');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('detects standup/sprint signals', () => {
      const result = detectMeetingType(SAMPLE_INTERNAL_TRANSCRIPT);

      const internalSignals = ['standup', 'sprint', 'backlog', 'velocity', 'blocker', 'team meeting'];
      const hasRelevantSignal = result.signals.some(s =>
        internalSignals.some(is => s.toLowerCase().includes(is))
      );
      expect(hasRelevantSignal).toBe(true);
    });
  });

  describe('detects technical discussions', () => {
    it('identifies technical keywords', () => {
      const result = detectMeetingType(SAMPLE_TECHNICAL_TRANSCRIPT);

      expect(result.meetingType).toBe('technical_discussion');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('falls back to general for ambiguous content', () => {
    it('returns general type for generic conversation', () => {
      const genericTranscript = 'Hello, how are you doing today? Fine thanks. See you later.';
      const result = detectMeetingType(genericTranscript);

      expect(result.meetingType).toBe('general');
    });
  });

  describe('uses meeting topic for additional context', () => {
    it('boosts score when topic matches type keywords', () => {
      const minimalTranscript = 'Hello and thanks for joining.';
      const resultWithTopic = detectMeetingType(minimalTranscript, 'Sales Demo - Product Pricing');
      const resultWithoutTopic = detectMeetingType(minimalTranscript);

      // With a sales-oriented topic, confidence should be higher than without
      expect(resultWithTopic.confidence).toBeGreaterThanOrEqual(resultWithoutTopic.confidence);
    });
  });

  describe('tone detection', () => {
    it('detects casual tone from casual language', () => {
      const casualTranscript = 'Hey yeah that sounds awesome! Cool cool, no worries at all. Gonna get that done super quick. Totally agree, haha.';
      const result = detectMeetingType(casualTranscript);

      expect(result.tone).toBe('casual');
    });

    it('detects formal tone from formal language', () => {
      const formalTranscript = 'Regarding the matter discussed, we would like to kindly request at your earliest convenience that you please be advised of the following. Respectfully, we hereby submit this proposal.';
      const result = detectMeetingType(formalTranscript);

      expect(result.tone).toBe('formal');
    });

    it('defaults to neutral tone for balanced language', () => {
      const neutralTranscript = 'Let us discuss the project. There are some items to review. We can proceed with the next steps.';
      const result = detectMeetingType(neutralTranscript);

      expect(result.tone).toBe('neutral');
    });
  });

  describe('confidence scoring', () => {
    it('returns confidence between 0 and 100', () => {
      const result = detectMeetingType(SAMPLE_SALES_TRANSCRIPT);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('caps confidence at 100 for heavily-signaled content', () => {
      // Repeat many sales keywords to push score high
      const heavySales = `
        pricing pricing pricing proposal proposal demo demo
        budget cost competitor trial pilot poc contract terms
        decision maker stakeholder buying timeline to purchase
      `;
      const result = detectMeetingType(heavySales);

      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('limits signals to 5', () => {
    it('returns at most 5 signals', () => {
      const result = detectMeetingType(SAMPLE_SALES_TRANSCRIPT);

      expect(result.signals.length).toBeLessThanOrEqual(5);
    });
  });
});

// ============================================
// extractParticipants
// ============================================

describe('extractParticipants', () => {
  it('extracts speaker names from transcript', () => {
    const participants = extractParticipants(SAMPLE_SALES_TRANSCRIPT);

    expect(participants).toContain('John Smith');
    expect(participants).toContain('Jane Doe');
  });

  it('returns unique names only', () => {
    const transcript = 'Alice: Hello.\nAlice: How are you?\nBob: Good.';
    const participants = extractParticipants(transcript);

    const aliceCount = participants.filter(p => p === 'Alice').length;
    expect(aliceCount).toBe(1);
  });

  it('returns empty array when no speakers found', () => {
    const participants = extractParticipants('No speaker labels here at all.');

    expect(participants).toEqual([]);
  });

  it('handles single-word speaker names', () => {
    const transcript = 'Alice: Hello.\nBob: Hi.';
    const participants = extractParticipants(transcript);

    expect(participants).toContain('Alice');
    expect(participants).toContain('Bob');
  });

  it('ignores very long speaker names (>50 chars)', () => {
    const longName = 'A' + 'a'.repeat(50);
    const transcript = `${longName}: Hello.`;
    const participants = extractParticipants(transcript);

    // The 51-char name should be excluded
    expect(participants).not.toContain(longName);
  });
});

// ============================================
// Quality Scoring
// ============================================

describe('scoreDraft', () => {
  function createMockDraft(overrides: Partial<ParsedDraftResponse> = {}): ParsedDraftResponse {
    return {
      meetingSummary: 'We discussed the project timeline and deliverables.',
      keyTopics: [{ topic: 'Timeline', duration: '10 min' }],
      keyDecisions: [{ decision: 'Launch by March', context: 'Q1 deadline' }],
      subject: 'Re: Project timeline and Q1 deliverables',
      body: `Hi Sarah,\n\nThanks for the productive discussion about the project timeline today. I wanted to follow up on the key points we covered regarding the deliverables and launch schedule.\n\nBased on our conversation, I'll prepare the deployment plan and send it over by Friday. Could you review the architecture diagram we discussed and share your feedback?\n\nLooking forward to our next sync.\n\nBest regards`,
      actionItems: [
        { owner: 'John', task: 'Prepare deployment plan with timeline estimates', deadline: 'Friday' },
        { owner: 'Sarah', task: 'Review architecture diagram and share feedback', deadline: 'Next Monday' },
      ],
      meetingTypeDetected: 'technical_discussion',
      toneUsed: 'neutral',
      keyPointsReferenced: ['project timeline', 'deliverables', 'deployment plan'],
      ...overrides,
    };
  }

  const sampleTranscript = `
    John: Let's discuss the project timeline and deliverables for Q1.
    Sarah: The deployment plan needs updating. I'll review the architecture diagram.
    John: I'll prepare a revised deployment plan with timeline estimates by Friday.
    Sarah: That sounds great. Let me share my feedback on the architecture by next Monday.
  `;

  describe('overall scoring', () => {
    it('returns a score between 0 and 100', () => {
      const draft = createMockDraft();
      const result = scoreDraft(draft, sampleTranscript);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('returns breakdown with four categories', () => {
      const draft = createMockDraft();
      const result = scoreDraft(draft, sampleTranscript);

      expect(result.breakdown).toHaveProperty('subjectScore');
      expect(result.breakdown).toHaveProperty('bodyScore');
      expect(result.breakdown).toHaveProperty('actionItemsScore');
      expect(result.breakdown).toHaveProperty('structureScore');
    });

    it('overall equals sum of breakdown scores', () => {
      const draft = createMockDraft();
      const result = scoreDraft(draft, sampleTranscript);

      const sum =
        result.breakdown.subjectScore +
        result.breakdown.bodyScore +
        result.breakdown.actionItemsScore +
        result.breakdown.structureScore;
      expect(result.overall).toBe(sum);
    });
  });

  describe('subject scoring', () => {
    it('penalizes generic subject lines', () => {
      const genericDraft = createMockDraft({ subject: 'Follow-up' });
      const specificDraft = createMockDraft({ subject: 'Re: Project timeline and Q1 deliverables' });

      const genericResult = scoreDraft(genericDraft, sampleTranscript);
      const specificResult = scoreDraft(specificDraft, sampleTranscript);

      expect(genericResult.breakdown.subjectScore).toBeLessThan(specificResult.breakdown.subjectScore);
    });

    it('penalizes very long subject lines (>60 chars)', () => {
      const longSubject = createMockDraft({
        subject: 'This is a very long subject line that exceeds the recommended sixty character limit significantly timeline',
      });
      const result = scoreDraft(longSubject, sampleTranscript);

      expect(result.issues).toContain('Subject line too long (>60 chars)');
    });

    it('penalizes very short subject lines (<15 chars)', () => {
      const shortSubject = createMockDraft({ subject: 'Hi timeline' });
      const result = scoreDraft(shortSubject, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('Subject line too short'),
      ]));
    });
  });

  describe('body scoring', () => {
    it('penalizes very long bodies (>300 words)', () => {
      const longBody = createMockDraft({
        body: ('Hi Sarah,\n\n' + 'word '.repeat(350) + '\n\nBest regards').replace(/timeline/g, 'timeline'),
      });
      const result = scoreDraft(longBody, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('Body too long'),
      ]));
    });

    it('penalizes very short bodies (<50 words)', () => {
      const shortBody = createMockDraft({
        body: 'Hi Sarah,\n\nShort body.\n\nBest regards',
      });
      const result = scoreDraft(shortBody, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('Body too short'),
      ]));
    });

    it('penalizes generic phrases', () => {
      const genericBody = createMockDraft({
        body: `Hi Sarah,\n\nIt was great meeting you. Just wanted to follow up as discussed. Hope this email finds you well. Feel free to reach out if you have any questions about the timeline and deliverables. Please don't hesitate to contact us at your earliest convenience.\n\nBest regards`,
      });
      const result = scoreDraft(genericBody, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('generic phrase'),
      ]));
    });
  });

  describe('action items scoring', () => {
    it('gives partial credit when no action items present', () => {
      const noActions = createMockDraft({ actionItems: [] });
      const result = scoreDraft(noActions, sampleTranscript);

      expect(result.breakdown.actionItemsScore).toBe(10); // Partial credit
      expect(result.issues).toContain('No action items extracted');
    });

    it('penalizes action items without owners', () => {
      const noOwner = createMockDraft({
        actionItems: [{ owner: 'TBD', task: 'Review the proposal document', deadline: 'Friday' }],
      });
      const result = scoreDraft(noOwner, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('missing owner'),
      ]));
    });

    it('penalizes action items without specific deadlines', () => {
      const noDeadline = createMockDraft({
        actionItems: [{ owner: 'John', task: 'Complete the review of architecture', deadline: 'ASAP' }],
      });
      const result = scoreDraft(noDeadline, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('missing specific deadline'),
      ]));
    });

    it('penalizes vague action items (short task text)', () => {
      const vague = createMockDraft({
        actionItems: [{ owner: 'John', task: 'Do stuff', deadline: 'Friday' }],
      });
      const result = scoreDraft(vague, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('too vague'),
      ]));
    });

    it('penalizes too many action items (>5)', () => {
      const manyItems = createMockDraft({
        actionItems: Array.from({ length: 7 }, (_, i) => ({
          owner: `Person ${i}`,
          task: `Complete action item number ${i} with enough detail`,
          deadline: 'Next week',
        })),
      });
      const result = scoreDraft(manyItems, sampleTranscript);

      expect(result.issues).toEqual(expect.arrayContaining([
        expect.stringContaining('Too many action items'),
      ]));
    });
  });

  describe('structure scoring', () => {
    it('penalizes missing greeting', () => {
      const noGreeting = createMockDraft({
        body: 'Thanks for the meeting today. We discussed important items.\n\nBest regards',
      });
      const result = scoreDraft(noGreeting, sampleTranscript);

      expect(result.issues).toContain('Missing personalized greeting');
    });

    it('penalizes missing call-to-action', () => {
      const noCTA = createMockDraft({
        body: 'Hi Sarah,\n\nThe meeting was productive. We covered many topics about the timeline and deliverables.\n\nBest regards',
      });
      const result = scoreDraft(noCTA, sampleTranscript);

      expect(result.issues).toContain('Missing clear call-to-action');
    });

    it('penalizes wall-of-text (single paragraph)', () => {
      const wallOfText = createMockDraft({
        body: 'Hi Sarah, ' + 'This is all one paragraph about the timeline and deliverables discussion. '.repeat(5) + 'Could you please review?',
      });
      const result = scoreDraft(wallOfText, sampleTranscript);

      expect(result.issues).toContain('Body lacks paragraph structure');
    });
  });
});

// ============================================
// getQualityGrade
// ============================================

describe('getQualityGrade', () => {
  it('returns A for score >= 85', () => {
    expect(getQualityGrade(85)).toBe('A');
    expect(getQualityGrade(100)).toBe('A');
  });

  it('returns B for score 70-84', () => {
    expect(getQualityGrade(70)).toBe('B');
    expect(getQualityGrade(84)).toBe('B');
  });

  it('returns C for score 55-69', () => {
    expect(getQualityGrade(55)).toBe('C');
    expect(getQualityGrade(69)).toBe('C');
  });

  it('returns D for score 40-54', () => {
    expect(getQualityGrade(40)).toBe('D');
    expect(getQualityGrade(54)).toBe('D');
  });

  it('returns F for score below 40', () => {
    expect(getQualityGrade(39)).toBe('F');
    expect(getQualityGrade(0)).toBe('F');
  });
});

// ============================================
// meetsQualityThreshold
// ============================================

describe('meetsQualityThreshold', () => {
  it('returns true for score at or above default threshold (60)', () => {
    expect(meetsQualityThreshold(60)).toBe(true);
    expect(meetsQualityThreshold(100)).toBe(true);
  });

  it('returns false for score below default threshold', () => {
    expect(meetsQualityThreshold(59)).toBe(false);
    expect(meetsQualityThreshold(0)).toBe(false);
  });

  it('supports custom threshold', () => {
    expect(meetsQualityThreshold(50, 50)).toBe(true);
    expect(meetsQualityThreshold(49, 50)).toBe(false);
  });
});
