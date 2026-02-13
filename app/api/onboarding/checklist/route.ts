import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, calendarConnections, drafts, meetings, userOnboarding } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  actionUrl?: string;
  actionLabel?: string;
  optional?: boolean;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  isComplete: boolean;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user record
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Run all checks in parallel for performance
    const [
      calendarResult,
      draftsResult,
      meetingsResult,
      onboardingResult,
    ] = await Promise.all([
      // Check calendar connection
      db
        .select({ count: count() })
        .from(calendarConnections)
        .where(eq(calendarConnections.userId, user.id)),

      // Check drafts count
      db
        .select({ count: count() })
        .from(drafts)
        .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
        .where(eq(meetings.userId, user.id)),

      // Check meetings count
      db
        .select({ count: count() })
        .from(meetings)
        .where(eq(meetings.userId, user.id)),

      // Check onboarding preferences
      db
        .select()
        .from(userOnboarding)
        .where(eq(userOnboarding.clerkId, clerkId))
        .limit(1),
    ]);

    // Check platform connection status
    const hasPlatformConnected = user.zoomConnected || user.teamsConnected || user.meetConnected;
    const hasCalendarConnected = calendarResult[0].count > 0;
    const hasDraftGenerated = draftsResult[0].count > 0;
    const hasMeetingCaptured = meetingsResult[0].count > 0;
    const hasEmailPreference = onboardingResult[0]?.emailPreference != null;

    // Build checklist items
    const items: ChecklistItem[] = [
      {
        id: 'platform',
        label: 'Connect a Meeting Platform',
        description: 'Link Zoom, Teams, or Google Meet to capture transcripts',
        completed: hasPlatformConnected,
        actionUrl: '/dashboard/settings',
        actionLabel: 'Connect',
      },
      {
        id: 'calendar',
        label: 'Sync Your Calendar',
        description: 'See upcoming meetings and auto-process them',
        completed: hasCalendarConnected,
        actionUrl: '/dashboard/settings',
        actionLabel: 'Sync',
      },
      {
        id: 'draft',
        label: 'Generate First Draft',
        description: 'AI will create a follow-up email from your transcript',
        completed: hasDraftGenerated,
        actionUrl: hasPlatformConnected ? undefined : '/dashboard/settings',
        actionLabel: hasPlatformConnected ? 'Waiting for meeting' : 'Connect first',
      },
      {
        id: 'preferences',
        label: 'Set Email Preferences',
        description: 'Choose to review drafts or send automatically',
        completed: hasEmailPreference,
        actionUrl: '/dashboard/settings',
        actionLabel: 'Configure',
      },
      {
        id: 'meeting',
        label: 'Capture First Meeting',
        description: 'Your first meeting transcript has been processed',
        completed: hasMeetingCaptured,
        actionUrl: hasPlatformConnected ? undefined : '/dashboard/settings',
        actionLabel: hasPlatformConnected ? 'Waiting for meeting' : 'Connect first',
      },
      {
        id: 'crm',
        label: 'Connect Your CRM',
        description: 'Auto-log meetings to Airtable, HubSpot, or Salesforce',
        completed: false, // TODO: Track per-user CRM connection
        actionUrl: '/dashboard/settings',
        actionLabel: 'Setup CRM',
        optional: true,
      },
    ];

    // Count only required items for progress (exclude optional)
    const requiredItems = items.filter(item => !item.optional);
    const completedCount = requiredItems.filter(item => item.completed).length;
    const totalCount = requiredItems.length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);
    const isComplete = completedCount === totalCount;

    // If complete and not already marked, update userOnboarding
    if (isComplete && onboardingResult[0] && !onboardingResult[0].completedAt) {
      await db
        .update(userOnboarding)
        .set({
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.clerkId, clerkId));
    }

    const response: ChecklistResponse = {
      items,
      completedCount,
      totalCount,
      percentComplete,
      isComplete,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ONBOARDING-CHECKLIST-ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}
