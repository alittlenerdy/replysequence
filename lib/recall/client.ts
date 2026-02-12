/**
 * Recall.ai API Client
 * Handles all communication with Recall.ai API
 */

import type {
  Bot,
  CreateBotRequest,
  Transcript,
  RecallApiError,
} from './types';

// Get base URL from environment (supports regional endpoints)
const RECALL_API_BASE_URL = process.env.RECALL_API_BASE_URL || 'https://us-west-2.recall.ai/api/v1';
const RECALL_API_KEY = process.env.RECALL_API_KEY;

class RecallClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = RECALL_API_BASE_URL;
    this.apiKey = RECALL_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[RECALL-CLIENT] RECALL_API_KEY not configured');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let error: RecallApiError;
      try {
        error = JSON.parse(errorBody);
      } catch {
        error = { error: errorBody };
      }

      console.error('[RECALL-CLIENT] API Error:', {
        endpoint,
        status: response.status,
        error,
      });

      throw new Error(`Recall API Error: ${response.status} - ${error.message || error.error}`);
    }

    return response.json();
  }

  /**
   * Create a new bot to join a meeting
   */
  async createBot(request: CreateBotRequest): Promise<Bot> {
    console.log('[RECALL-CLIENT] Creating bot for meeting:', {
      meetingUrl: request.meeting_url,
      botName: request.bot_name,
      joinAt: request.join_at,
    });

    const bot = await this.request<Bot>('/bot', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    console.log('[RECALL-CLIENT] Bot created:', {
      botId: bot.id,
      status: bot.status_changes?.[0]?.code,
    });

    return bot;
  }

  /**
   * Get bot details by ID
   */
  async getBot(botId: string): Promise<Bot> {
    return this.request<Bot>(`/bot/${botId}`);
  }

  /**
   * List all bots with optional filters
   */
  async listBots(params?: {
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ results: Bot[]; next?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    return this.request(`/bot${query ? `?${query}` : ''}`);
  }

  /**
   * Delete/cancel a bot
   */
  async deleteBot(botId: string): Promise<void> {
    await this.request(`/bot/${botId}`, {
      method: 'DELETE',
    });

    console.log('[RECALL-CLIENT] Bot deleted:', { botId });
  }

  /**
   * Get transcript for a bot
   */
  async getTranscript(botId: string): Promise<Transcript | null> {
    try {
      const bot = await this.getBot(botId);

      if (!bot.transcript?.id) {
        console.log('[RECALL-CLIENT] No transcript available for bot:', { botId });
        return null;
      }

      return this.request<Transcript>(`/transcript/${bot.transcript.id}`);
    } catch (error) {
      console.error('[RECALL-CLIENT] Error fetching transcript:', {
        botId,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Create async transcript for a recording
   */
  async createAsyncTranscript(recordingId: string, provider?: string): Promise<Transcript> {
    return this.request<Transcript>(`/recording/${recordingId}/create_transcript_create`, {
      method: 'POST',
      body: JSON.stringify({
        provider: provider || 'recall',
      }),
    });
  }

  /**
   * Schedule a bot to join a meeting at a specific time
   */
  async scheduleBot(
    meetingUrl: string,
    joinAt: Date,
    options?: {
      botName?: string;
      transcriptionWebhookUrl?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<Bot> {
    const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const request: CreateBotRequest = {
      meeting_url: meetingUrl,
      bot_name: options?.botName || 'ReplySequence',
      join_at: joinAt.toISOString(),
      transcription_options: {
        provider: 'recall',
        language: 'en',
      },
      real_time_transcription: options?.transcriptionWebhookUrl ? {
        destination_url: options.transcriptionWebhookUrl,
        partial_results: false,
      } : undefined,
      automatic_leave: {
        waiting_room_timeout: 600, // 10 minutes in waiting room
        noone_joined_timeout: 300, // 5 minutes if no one joins
        everyone_left_timeout: 30, // 30 seconds after everyone leaves
      },
      metadata: options?.metadata,
    };

    return this.createBot(request);
  }

  /**
   * Check if the API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let recallClient: RecallClient | null = null;

export function getRecallClient(): RecallClient {
  if (!recallClient) {
    recallClient = new RecallClient();
  }
  return recallClient;
}

export { RecallClient };
