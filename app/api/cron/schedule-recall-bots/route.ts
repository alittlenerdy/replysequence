/**
 * Cron Job: Schedule Recall Bots
 * Runs periodically to scan calendar events and schedule bots for upcoming meetings
 *
 * Recommended schedule: Every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanAndScheduleBots } from '@/lib/recall/scheduler';

export const maxDuration = 60; // Allow up to 60 seconds

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn('[CRON-SCHEDULE-BOTS] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON-SCHEDULE-BOTS] Starting scheduled bot scan...');

  try {
    const result = await scanAndScheduleBots();

    const duration = Date.now() - startTime;
    console.log('[CRON-SCHEDULE-BOTS] Scan complete:', {
      ...result,
      duration,
    });

    return NextResponse.json({
      success: true,
      ...result,
      duration,
    });
  } catch (error) {
    console.error('[CRON-SCHEDULE-BOTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
