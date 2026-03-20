/**
 * Language Detection for Meeting Transcripts
 *
 * Lightweight heuristic-based language detection using common word patterns.
 * Falls back to Claude Haiku for higher accuracy when available.
 * Returns ISO 639-1 language codes.
 */

import { callClaudeAPI } from './claude-api';

/** Supported languages with ISO 639-1 codes */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  it: 'Italian',
  nl: 'Dutch',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Common word patterns for heuristic language detection.
 * Each language has high-frequency function words that are distinctive.
 */
const LANGUAGE_PATTERNS: Record<LanguageCode, RegExp[]> = {
  en: [/\bthe\b/i, /\band\b/i, /\bthat\b/i, /\bhave\b/i, /\bwith\b/i, /\bthis\b/i, /\bwill\b/i, /\byour\b/i],
  es: [/\bque\b/i, /\blos\b/i, /\bdel\b/i, /\blas\b/i, /\bpor\b/i, /\buna\b/i, /\bcon\b/i, /\bestá\b/i],
  fr: [/\bles\b/i, /\bdes\b/i, /\bque\b/i, /\bune\b/i, /\bavec\b/i, /\bpour\b/i, /\bdans\b/i, /\bc'est\b/i],
  de: [/\bund\b/i, /\bdie\b/i, /\bder\b/i, /\bdas\b/i, /\bein\b/i, /\bist\b/i, /\bmit\b/i, /\bauch\b/i],
  pt: [/\bque\b/i, /\bnão\b/i, /\buma\b/i, /\bcom\b/i, /\bpara\b/i, /\bdos\b/i, /\bpelo\b/i, /\bestá\b/i],
  ja: [/[\u3040-\u309F]/, /[\u30A0-\u30FF]/, /[\u4E00-\u9FAF]/], // hiragana, katakana, kanji
  zh: [/[\u4E00-\u9FFF]/, /[\u3400-\u4DBF]/], // CJK unified ideographs
  ko: [/[\uAC00-\uD7AF]/, /[\u1100-\u11FF]/], // hangul syllables, jamo
  it: [/\bche\b/i, /\bdel\b/i, /\bnon\b/i, /\buna\b/i, /\bcon\b/i, /\bper\b/i, /\bdella\b/i, /\bsono\b/i],
  nl: [/\bhet\b/i, /\been\b/i, /\bvan\b/i, /\bdat\b/i, /\bniet\b/i, /\bzijn\b/i, /\bwas\b/i, /\bmet\b/i],
};

/**
 * Detect language from transcript text using simple heuristics.
 * Takes the first 500 characters for efficiency.
 *
 * @param text - Transcript text to analyze
 * @returns ISO 639-1 language code and confidence score
 */
export function detectLanguageHeuristic(text: string): { language: LanguageCode; confidence: number } {
  const sample = text.slice(0, 500).toLowerCase();

  // For CJK languages, check character ranges first (they're unambiguous)
  const jaCount = (sample.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const zhCount = (sample.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
  const koCount = (sample.match(/[\uAC00-\uD7AF\u1100-\u11FF]/g) || []).length;

  // Japanese has hiragana/katakana which Chinese doesn't
  if (jaCount > 5) return { language: 'ja', confidence: 0.9 };
  if (koCount > 5) return { language: 'ko', confidence: 0.9 };
  if (zhCount > 10) return { language: 'zh', confidence: 0.85 };

  // For Latin-script languages, count pattern matches
  const scores: Partial<Record<LanguageCode, number>> = {};
  const latinLanguages: LanguageCode[] = ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl'];

  for (const lang of latinLanguages) {
    const patterns = LANGUAGE_PATTERNS[lang];
    let matchCount = 0;
    for (const pattern of patterns) {
      const matches = sample.match(new RegExp(pattern.source, 'gi'));
      matchCount += matches ? matches.length : 0;
    }
    scores[lang] = matchCount;
  }

  // Find highest-scoring language
  let bestLang: LanguageCode = 'en';
  let bestScore = 0;
  let secondScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score! > bestScore) {
      secondScore = bestScore;
      bestScore = score!;
      bestLang = lang as LanguageCode;
    } else if (score! > secondScore) {
      secondScore = score!;
    }
  }

  // Confidence is based on margin between top two languages
  const confidence = bestScore > 0
    ? Math.min(0.95, 0.5 + (bestScore - secondScore) / (bestScore + 1) * 0.5)
    : 0.3;

  return { language: bestLang, confidence };
}

/**
 * Detect language using Claude Haiku for higher accuracy.
 * Used when heuristic confidence is low.
 *
 * @param text - Transcript text to analyze
 * @returns ISO 639-1 language code
 */
async function detectLanguageWithClaude(text: string): Promise<LanguageCode> {
  const sample = text.slice(0, 500);
  const validCodes = Object.keys(SUPPORTED_LANGUAGES).join(', ');

  const response = await callClaudeAPI({
    systemPrompt: `You are a language detector. Respond with ONLY the ISO 639-1 language code. Valid codes: ${validCodes}`,
    userPrompt: `What language is this text written in? Respond with only the 2-letter code.\n\n${sample}`,
    maxTokens: 10,
    timeoutMs: 5000,
  });

  const code = response.content.trim().toLowerCase().slice(0, 2) as LanguageCode;
  return code in SUPPORTED_LANGUAGES ? code : 'en';
}

/**
 * Detect the language of a transcript.
 * Uses heuristics first, falls back to Claude Haiku if confidence is low.
 *
 * @param text - Full transcript text
 * @param useClaude - Whether to use Claude as fallback (default: true)
 * @returns ISO 639-1 language code
 */
export async function detectLanguage(text: string, useClaude = true): Promise<LanguageCode> {
  if (!text || text.trim().length < 20) {
    return 'en'; // Default to English for very short or empty text
  }

  const { language, confidence } = detectLanguageHeuristic(text);

  // If confidence is high enough, use heuristic result
  if (confidence >= 0.7) {
    return language;
  }

  // Try Claude for better accuracy
  if (useClaude) {
    try {
      return await detectLanguageWithClaude(text);
    } catch {
      // Fall back to heuristic result if Claude fails
      return language;
    }
  }

  return language;
}

/**
 * Get the display name for a language code.
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code as LanguageCode] || code.toUpperCase();
}
