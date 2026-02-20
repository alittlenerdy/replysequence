/** Shared analytics types — used by both the API route and dashboard components. */

export interface DailyDataPoint {
  date: string;
  count: number;
}

export interface PlatformStat {
  platform: string;
  count: number;
  color: string;
}

export interface EmailFunnelData {
  total: number;
  ready: number;
  sent: number;
  conversionRate: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
}

export interface ROIMetrics {
  hoursSaved: number;
  dollarValue: number;
  hourlyRate: number;
  emailsPerHour: number;
}

export interface EmailEngagementData {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  avgTimeToOpen: number | null;
}

export interface MeetingTypeStat {
  type: string;
  count: number;
  color: string;
}

export interface AIUsageMetrics {
  totalCost: number;
  avgLatency: number;
  totalMeetingMinutes: number;
}

/** At-risk meeting: a meeting in the date range with no sent draft */
export interface AtRiskMeeting {
  meetingId: string;
  topic: string | null;
  hostEmail: string;
  endTime: string | null;
  draftStatus: 'none' | 'generated' | 'failed';
  draftId: string | null;
  contactName: string | null;
}

/** Per-speaker analytics computed from transcript segments */
export interface SpeakerStat {
  speaker: string;
  talkTimeMs: number;
  talkTimePercent: number;
  segmentCount: number;
  avgSegmentMs: number;
  questionCount: number;
  longestMonologueMs: number;
  monologueCount: number; // segments > 60s
}

/** Aggregate speaker analytics across all meetings */
export interface SpeakerAnalytics {
  totalSpeakers: number;
  totalTalkTimeMs: number;
  totalMonologues: number;
  avgTalkToListenRatio: number | null; // ratio of user talk vs total, null if no user data
  speakers: SpeakerStat[];
  meetingsAnalyzed: number;
}

/** Per-day coverage metrics */
export interface DailyCoverage {
  date: string;
  meetingsCount: number;
  followedUpCount: number;
  coveragePercent: number;
}

export interface AnalyticsData {
  // Core stats
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
  // Period comparisons
  meetingsComparison: PeriodComparison;
  emailsComparison: PeriodComparison;
  sentComparison: PeriodComparison;
  // ROI
  roi: ROIMetrics;
  // Trends
  dailyMeetings: DailyDataPoint[];
  dailyEmails: DailyDataPoint[];
  // Platform breakdown
  platformBreakdown: PlatformStat[];
  // Funnel
  emailFunnel: EmailFunnelData;
  // Email engagement
  engagement: EmailEngagementData;
  // Meeting type breakdown
  meetingTypeBreakdown: MeetingTypeStat[];
  // AI usage
  aiUsage: AIUsageMetrics;
  // New fields for redesign
  medianFollowUpTimeHours: number | null;
  atRiskMeetings: AtRiskMeeting[];
  dailyCoverage: DailyCoverage[];
  // Speaker analytics
  speakerAnalytics: SpeakerAnalytics;
  // User context for nudge logic
  aiOnboardingComplete: boolean;
  hourlyRate: number;
}
