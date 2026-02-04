import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, meetings, transcripts, drafts, usageLogs, zoomConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * GET /api/user/export
 *
 * GDPR-compliant data export endpoint.
 * Returns all user data in a downloadable JSON format.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting - strict limit for GDPR exports
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`gdpr-export:${clientId}`, RATE_LIMITS.GDPR);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Gather all user data
    const userMeetings = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        platform: meetings.platform,
        hostEmail: meetings.hostEmail,
        startTime: meetings.startTime,
        endTime: meetings.endTime,
        duration: meetings.duration,
        status: meetings.status,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(eq(meetings.hostEmail, user.email));

    const meetingIds = userMeetings.map((m) => m.id);

    // Get transcripts for user's meetings
    const userTranscripts = meetingIds.length > 0
      ? await db
          .select({
            id: transcripts.id,
            meetingId: transcripts.meetingId,
            wordCount: transcripts.wordCount,
            language: transcripts.language,
            status: transcripts.status,
            createdAt: transcripts.createdAt,
            // Note: Excluding full content for size, available on request
          })
          .from(transcripts)
          .where(eq(transcripts.meetingId, meetingIds[0]))
      : [];

    // Get drafts for user's meetings
    const userDrafts = meetingIds.length > 0
      ? await db
          .select({
            id: drafts.id,
            meetingId: drafts.meetingId,
            subject: drafts.subject,
            body: drafts.body,
            status: drafts.status,
            meetingType: drafts.meetingType,
            toneUsed: drafts.toneUsed,
            qualityScore: drafts.qualityScore,
            sentAt: drafts.sentAt,
            sentTo: drafts.sentTo,
            createdAt: drafts.createdAt,
          })
          .from(drafts)
          .where(eq(drafts.meetingId, meetingIds[0]))
      : [];

    // Get usage logs
    const userUsageLogs = await db
      .select({
        id: usageLogs.id,
        action: usageLogs.action,
        metadata: usageLogs.metadata,
        createdAt: usageLogs.createdAt,
      })
      .from(usageLogs)
      .where(eq(usageLogs.userId, user.id));

    // Get connected integrations (without tokens)
    const userIntegrations = await db
      .select({
        platform: zoomConnections.zoomEmail,
        connectedAt: zoomConnections.connectedAt,
      })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id));

    // Compile export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
        connectedPlatforms: {
          zoom: user.zoomConnected,
          teams: user.teamsConnected,
          meet: user.meetConnected,
        },
      },
      meetings: userMeetings,
      transcripts: userTranscripts,
      drafts: userDrafts,
      usageLogs: userUsageLogs,
      integrations: userIntegrations,
      dataRetentionPolicy: {
        description: 'Data is retained for the duration of your account. Upon account deletion, all data is permanently removed within 30 days.',
        lawfulBasis: 'Contract performance and legitimate interest',
      },
    };

    // Return as downloadable JSON file
    const filename = `replysequence-export-${user.id}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
