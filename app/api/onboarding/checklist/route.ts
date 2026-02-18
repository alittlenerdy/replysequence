import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, calendarConnections, drafts, meetings, userOnboarding, hubspotConnections, airtableConnections } from '@/lib/db/schema';
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

    // New users without a database record - return default onboarding state
    if (!user) {
      const defaultItems: ChecklistItem[] = [
        {
          id: 'connect_calendar',
          label: 'Connect your calendar',
          description: 'Link Google Calendar or Outlook to see upcoming meetings',
          completed: false,
          actionUrl: '/dashboard/settings',
          actionLabel: 'Connect Calendar',
        },
        {
          id: 'connect_meeting_platform',
          label: 'Connect a meeting platform',
          description: 'Link Zoom, Teams, or Meet to capture transcripts',
          completed: false,
          actionUrl: '/dashboard/settings',
          actionLabel: 'Connect Platform',
        },
        {
          id: 'first_draft',
          label: 'Generate your first draft',
          description: 'Complete a meeting to see AI-generated follow-up emails',
          completed: false,
          optional: true,
        },
      ];
      return NextResponse.json({
        items: defaultItems,
        completedCount: 0,
        totalCount: defaultItems.filter(i => !i.optional).length,
        percentComplete: 0,
        isComplete: false,
      } as ChecklistResponse);
    }

    // Run all checks in parallel for performance
    const [
      calendarResult,
      draftsResult,
      meetingsResult,
      onboardingResult,
      hubspotResult,
      airtableResult,
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

      // Check HubSpot CRM connection
      db
        .select({ count: count() })
        .from(hubspotConnections)
        .where(eq(hubspotConnections.userId, user.id)),

      // Check Airtable CRM connection
      db
        .select({ count: count() })
        .from(airtableConnections)
        .where(eq(airtableConnections.userId, user.id)),
    ]);

    // Check platform connection status
    const hasPlatformConnected = user.zoomConnected || user.teamsConnected || user.meetConnected;
    const hasCalendarConnected = calendarResult[0].count > 0;
    const hasDraftGenerated = draftsResult[0].count > 0;
    const hasMeetingCaptured = meetingsResult[0].count > 0;
    const hasEmailPreference = onboardingResult[0]?.emailPreference != null;
    const hasCrmConnected = hubspotResult[0].count > 0 || airtableResult[0].count > 0;

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
        completed: hasCrmConnected,
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
