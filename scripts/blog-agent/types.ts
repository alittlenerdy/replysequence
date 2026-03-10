// scripts/blog-agent/types.ts

export interface PainPoint {
  source: 'twitter' | 'reddit';
  text: string;
  author: string;
  url: string;
  engagement: number; // likes + retweets or upvotes
  timestamp: string;
}

export interface AnalyzedTopic {
  painPoints: PainPoint[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  postFormat: 'problem-solution' | 'comparison';
  title: string;
  slug: string;
}

export interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
}

export interface VoicePreferences {
  aiTone: 'professional' | 'casual' | 'friendly' | 'concise';
  aiCustomInstructions: string | null;
  userRole: string | null;
}
