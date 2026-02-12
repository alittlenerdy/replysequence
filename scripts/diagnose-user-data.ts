/**
 * Diagnostic script to investigate user data isolation issues
 * Run with: npx tsx scripts/diagnose-user-data.ts
 */

import 'dotenv/config';
import { db, users, meetings, meetConnections, zoomConnections, drafts } from '../lib/db';
import { eq, sql, desc } from 'drizzle-orm';

async function diagnose() {
  console.log('=== User Data Isolation Diagnostic ===\n');

  // Find all users
  const allUsers = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      zoomConnected: users.zoomConnected,
      meetConnected: users.meetConnected,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  console.log(`Found ${allUsers.length} users:\n`);

  for (const user of allUsers) {
    console.log(`--- User: ${user.email} ---`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Clerk ID: ${user.clerkId}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Zoom Connected: ${user.zoomConnected}`);
    console.log(`  Meet Connected: ${user.meetConnected}`);
    console.log(`  Created: ${user.createdAt?.toISOString()}`);

    // Check Meet connections for this user
    const meetConns = await db
      .select({
        id: meetConnections.id,
        googleEmail: meetConnections.googleEmail,
        googleDisplayName: meetConnections.googleDisplayName,
        connectedAt: meetConnections.connectedAt,
      })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id));

    if (meetConns.length > 0) {
      console.log(`  Meet Connections:`);
      for (const conn of meetConns) {
        console.log(`    - ${conn.googleEmail} (${conn.googleDisplayName || 'no name'})`);
        console.log(`      Connected: ${conn.connectedAt?.toISOString()}`);
      }
    }

    // Check Zoom connections for this user
    const zoomConns = await db
      .select({
        id: zoomConnections.id,
        zoomEmail: zoomConnections.zoomEmail,
        connectedAt: zoomConnections.connectedAt,
      })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id));

    if (zoomConns.length > 0) {
      console.log(`  Zoom Connections:`);
      for (const conn of zoomConns) {
        console.log(`    - ${conn.zoomEmail}`);
        console.log(`      Connected: ${conn.connectedAt?.toISOString()}`);
      }
    }

    // Count meetings for this user (by userId)
    const meetingsByUserId = await db
      .select({ count: sql<number>`count(*)` })
      .from(meetings)
      .where(eq(meetings.userId, user.id));

    // Count meetings by hostEmail matching user's email
    const meetingsByEmail = await db
      .select({ count: sql<number>`count(*)` })
      .from(meetings)
      .where(eq(meetings.hostEmail, user.email.toLowerCase()));

    // Get the emails that analytics would use for this user
    const analyticsEmails = new Set<string>();
    analyticsEmails.add(user.email.toLowerCase());
    for (const conn of meetConns) {
      analyticsEmails.add(conn.googleEmail.toLowerCase());
    }
    for (const conn of zoomConns) {
      analyticsEmails.add(conn.zoomEmail.toLowerCase());
    }

    console.log(`  Analytics Emails: [${[...analyticsEmails].join(', ')}]`);
    console.log(`  Meetings by userId: ${meetingsByUserId[0]?.count || 0}`);
    console.log(`  Meetings by hostEmail (user.email): ${meetingsByEmail[0]?.count || 0}`);

    console.log('');
  }

  // Now show all meetings and their associations
  console.log('\n=== Recent Meetings ===\n');

  const recentMeetings = await db
    .select({
      id: meetings.id,
      platform: meetings.platform,
      topic: meetings.topic,
      hostEmail: meetings.hostEmail,
      userId: meetings.userId,
      status: meetings.status,
      createdAt: meetings.createdAt,
    })
    .from(meetings)
    .orderBy(desc(meetings.createdAt))
    .limit(20);

  for (const meeting of recentMeetings) {
    // Find the associated user
    let associatedUser = 'None (userId is null)';
    if (meeting.userId) {
      const [mUser] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, meeting.userId))
        .limit(1);
      associatedUser = mUser?.email || `Unknown (${meeting.userId})`;
    }

    // Count drafts for this meeting
    const draftCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(drafts)
      .where(eq(drafts.meetingId, meeting.id));

    console.log(`Meeting: ${meeting.topic || 'Untitled'}`);
    console.log(`  ID: ${meeting.id}`);
    console.log(`  Platform: ${meeting.platform}`);
    console.log(`  Host Email: ${meeting.hostEmail}`);
    console.log(`  User ID: ${meeting.userId || 'NULL'}`);
    console.log(`  Associated User: ${associatedUser}`);
    console.log(`  Status: ${meeting.status}`);
    console.log(`  Drafts: ${draftCount[0]?.count || 0}`);
    console.log(`  Created: ${meeting.createdAt?.toISOString()}`);
    console.log('');
  }

  // Check for orphaned meetings (no userId set)
  const orphanedMeetings = await db
    .select({ count: sql<number>`count(*)` })
    .from(meetings)
    .where(sql`${meetings.userId} IS NULL`);

  console.log(`\n=== Summary ===`);
  console.log(`Total users: ${allUsers.length}`);
  console.log(`Total meetings (recent 20 shown): Check above`);
  console.log(`Orphaned meetings (no userId): ${orphanedMeetings[0]?.count || 0}`);

  process.exit(0);
}

diagnose().catch((err) => {
  console.error('Diagnostic failed:', err);
  process.exit(1);
});
