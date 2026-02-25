/**
 * Tests for lib/transcript/vtt-parser.ts
 *
 * Covers: VTT parsing, speaker extraction, segment merging,
 * timestamp handling, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import { SAMPLE_VTT, SAMPLE_VTT_NO_SPEAKERS } from '../helpers';

// ============================================
// parseVTT - Valid VTT with speakers
// ============================================

describe('parseVTT', () => {
  describe('parses valid VTT format with speaker names', () => {
    it('extracts speaker segments from standard VTT content', () => {
      const result = parseVTT(SAMPLE_VTT);

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.fullText.length).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('identifies distinct speakers', () => {
      const result = parseVTT(SAMPLE_VTT);
      const speakers = new Set(result.segments.map(s => s.speaker));

      expect(speakers.has('John Smith')).toBe(true);
      expect(speakers.has('Jane Doe')).toBe(true);
    });

    it('parses timestamps correctly', () => {
      const result = parseVTT(SAMPLE_VTT);
      const firstSegment = result.segments[0];

      // First segment starts at 0ms
      expect(firstSegment.start_time).toBe(0);
      // End time should be a positive number
      expect(firstSegment.end_time).toBeGreaterThan(0);
    });

    it('extracts text content without speaker prefix', () => {
      const result = parseVTT(SAMPLE_VTT);
      const firstSegment = result.segments[0];

      // Text should not contain the "Speaker: " prefix
      expect(firstSegment.text).not.toContain('John Smith:');
      expect(firstSegment.text).toContain('Hello everyone');
    });

    it('includes speaker names in fullText output', () => {
      const result = parseVTT(SAMPLE_VTT);

      // fullText format is "Speaker: text"
      expect(result.fullText).toContain('John Smith:');
      expect(result.fullText).toContain('Jane Doe:');
    });

    it('counts words accurately', () => {
      const result = parseVTT(SAMPLE_VTT);

      // wordCount should match the actual word count of fullText
      const manualCount = result.fullText.split(/\s+/).filter(w => w.length > 0).length;
      expect(result.wordCount).toBe(manualCount);
    });
  });

  // ============================================
  // VTT without speaker names
  // ============================================

  describe('handles missing speaker names', () => {
    it('assigns Unknown as default speaker', () => {
      const result = parseVTT(SAMPLE_VTT_NO_SPEAKERS);
      const speakers = new Set(result.segments.map(s => s.speaker));

      expect(speakers.has('Unknown')).toBe(true);
    });

    it('still parses text content', () => {
      const result = parseVTT(SAMPLE_VTT_NO_SPEAKERS);

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.fullText).toContain('Hello everyone');
    });
  });

  // ============================================
  // Edge cases
  // ============================================

  describe('edge cases', () => {
    it('returns empty segments for empty input', () => {
      const result = parseVTT('');

      expect(result.segments).toEqual([]);
      expect(result.fullText).toBe('');
      expect(result.wordCount).toBe(0);
    });

    it('returns empty segments for WEBVTT header only', () => {
      const result = parseVTT('WEBVTT\n\n');

      expect(result.segments).toEqual([]);
      expect(result.fullText).toBe('');
    });

    it('handles VTT with NOTE sections', () => {
      const vttWithNotes = `WEBVTT

NOTE This is a note

1
00:00:00.000 --> 00:00:05.000
Speaker One: Hello there.
`;
      const result = parseVTT(vttWithNotes);

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.segments[0].speaker).toBe('Speaker One');
    });

    it('handles VTT without cue identifiers (numbers)', () => {
      const vttNoIds = `WEBVTT

00:00:00.000 --> 00:00:05.000
Alice: First segment.

00:00:06.000 --> 00:00:10.000
Bob: Second segment.
`;
      const result = parseVTT(vttNoIds);

      expect(result.segments.length).toBe(2);
      expect(result.segments[0].speaker).toBe('Alice');
      expect(result.segments[1].speaker).toBe('Bob');
    });

    it('strips HTML tags from cue text', () => {
      const vttWithHtml = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
<b>Speaker</b>: <i>Hello</i> world.
`;
      const result = parseVTT(vttWithHtml);

      // After stripping HTML, speaker extraction should work or text should be clean
      expect(result.segments.length).toBeGreaterThan(0);
      const text = result.segments[0].text;
      expect(text).not.toContain('<b>');
      expect(text).not.toContain('<i>');
    });

    it('handles MM:SS.mmm timestamp format (no hours)', () => {
      const vttShortTimestamps = `WEBVTT

1
00:00.000 --> 00:05.000
Speaker: Short format timestamps.
`;
      const result = parseVTT(vttShortTimestamps);

      expect(result.segments.length).toBe(1);
      expect(result.segments[0].start_time).toBe(0);
      expect(result.segments[0].end_time).toBe(5000);
    });
  });

  // ============================================
  // Merging consecutive speaker segments
  // ============================================

  describe('merges consecutive segments from same speaker', () => {
    it('merges segments from the same speaker within 2 seconds', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Alice: First part of the sentence.

2
00:00:03.500 --> 00:00:06.000
Alice: Second part of the sentence.

3
00:00:07.000 --> 00:00:10.000
Bob: Different speaker.
`;
      const result = parseVTT(vtt);

      // Alice's two segments (gap = 500ms < 2000ms) should merge
      expect(result.segments.length).toBe(2);
      expect(result.segments[0].speaker).toBe('Alice');
      expect(result.segments[0].text).toContain('First part');
      expect(result.segments[0].text).toContain('Second part');
      expect(result.segments[1].speaker).toBe('Bob');
    });

    it('does not merge segments from different speakers', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Alice: Hello.

2
00:00:03.500 --> 00:00:06.000
Bob: Hi there.
`;
      const result = parseVTT(vtt);

      expect(result.segments.length).toBe(2);
      expect(result.segments[0].speaker).toBe('Alice');
      expect(result.segments[1].speaker).toBe('Bob');
    });

    it('does not merge same-speaker segments with gap > 2 seconds', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:03.000
Alice: First part.

2
00:00:06.000 --> 00:00:09.000
Alice: After a long pause.
`;
      const result = parseVTT(vtt);

      // Gap is 3000ms > 2000ms, so they should not merge
      expect(result.segments.length).toBe(2);
    });
  });

  // ============================================
  // Multi-line cue text
  // ============================================

  describe('handles multi-line cue text', () => {
    it('joins multiple lines within a single cue', () => {
      const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
Alice: This is the first line
and this is the continuation.
`;
      const result = parseVTT(vtt);

      expect(result.segments.length).toBe(1);
      expect(result.segments[0].text).toContain('first line');
      expect(result.segments[0].text).toContain('continuation');
    });
  });
});
