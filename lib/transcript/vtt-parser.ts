import type { SpeakerSegment } from '../db/schema';

// Result interface for VTT parsing
export interface VTTParseResult {
  fullText: string;
  segments: SpeakerSegment[];
  wordCount: number;
}

/**
 * Parse timestamp string to milliseconds
 * Supports formats: "00:00:00.000" or "00:00.000"
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.trim().split(':');
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1]);
  }

  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Extract speaker name from VTT cue text
 * Zoom format: "Speaker Name: Text here"
 */
function extractSpeaker(text: string): { speaker: string; content: string } {
  // Match pattern like "John Doe: Hello everyone"
  const speakerMatch = text.match(/^([^:]+):\s*(.*)$/s);

  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      content: speakerMatch[2].trim(),
    };
  }

  return {
    speaker: 'Unknown',
    content: text.trim(),
  };
}

/**
 * Parse WebVTT content into structured segments
 * @param vttContent - Raw VTT file content
 * @returns Parsed result with full text, segments, and word count
 */
export function parseVTT(vttContent: string): VTTParseResult {
  const segments: SpeakerSegment[] = [];
  const lines = vttContent.split('\n');

  let currentSegment: Partial<SpeakerSegment> | null = null;
  let textBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and WEBVTT header
    if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) {
      // If we have a pending segment, finalize it
      if (currentSegment && textBuffer.length > 0) {
        const combinedText = textBuffer.join(' ');
        const { speaker, content } = extractSpeaker(combinedText);

        segments.push({
          speaker,
          start_time: currentSegment.start_time!,
          end_time: currentSegment.end_time!,
          text: content,
        });

        textBuffer = [];
        currentSegment = null;
      }
      continue;
    }

    // Check for timestamp line: "00:00:00.000 --> 00:00:05.000"
    const timestampMatch = line.match(
      /(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{3})?)\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{3})?)/
    );

    if (timestampMatch) {
      // Finalize previous segment if exists
      if (currentSegment && textBuffer.length > 0) {
        const combinedText = textBuffer.join(' ');
        const { speaker, content } = extractSpeaker(combinedText);

        segments.push({
          speaker,
          start_time: currentSegment.start_time!,
          end_time: currentSegment.end_time!,
          text: content,
        });

        textBuffer = [];
      }

      // Start new segment
      currentSegment = {
        start_time: parseTimestamp(timestampMatch[1]),
        end_time: parseTimestamp(timestampMatch[2]),
      };
      continue;
    }

    // Skip cue identifiers (numbers or other identifiers before timestamps)
    if (/^\d+$/.test(line) || line.includes('-->')) {
      continue;
    }

    // This is text content
    if (currentSegment) {
      // Remove HTML tags if present
      const cleanText = line.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        textBuffer.push(cleanText);
      }
    }
  }

  // Handle last segment
  if (currentSegment && textBuffer.length > 0) {
    const combinedText = textBuffer.join(' ');
    const { speaker, content } = extractSpeaker(combinedText);

    segments.push({
      speaker,
      start_time: currentSegment.start_time!,
      end_time: currentSegment.end_time!,
      text: content,
    });
  }

  // Merge consecutive segments from same speaker
  const mergedSegments = mergeConsecutiveSpeakerSegments(segments);

  // Build full text
  const fullText = mergedSegments
    .map((seg) => `${seg.speaker}: ${seg.text}`)
    .join('\n\n');

  // Count words
  const wordCount = fullText.split(/\s+/).filter((word) => word.length > 0).length;

  return {
    fullText,
    segments: mergedSegments,
    wordCount,
  };
}

/**
 * Merge consecutive segments from the same speaker
 */
function mergeConsecutiveSpeakerSegments(segments: SpeakerSegment[]): SpeakerSegment[] {
  if (segments.length === 0) return [];

  const merged: SpeakerSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];

    // If same speaker and close in time (within 2 seconds), merge
    if (
      next.speaker === current.speaker &&
      next.start_time - current.end_time < 2000
    ) {
      current.text += ' ' + next.text;
      current.end_time = next.end_time;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}
