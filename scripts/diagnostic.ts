#!/usr/bin/env npx tsx
/**
 * Diagnostic script to check ReplySequence system status
 * Run with: npm run diagnostic
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { desc, sql } from 'drizzle-orm';
import {
  users,
  meetings,
  drafts,
  meetConnections,
  rawEvents,
} from '../lib/db/schema';

async function main() {
  console.log('\n=== ReplySequence System Diagnostic ===\n');
  console.log('Timestamp:', new Date().toISOString());

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
  });

  const db = drizzle(pool);

  try {
    // 1. Check Users
    console.log('\n--- USERS ---');
    const allUsers = await db.select().from(users);
    console.log(`Total users: ${allUsers.length}`);
    for (const user of allUsers) {
      console.log(`  - ${user.email} | Tier: ${user.subscriptionTier} | Zoom: ${user.zoomConnected} | Meet: ${user.meetConnected} | Teams: ${user.teamsConnected}`);
    }

    // 2. Check Meet Connections
    console.log('\n--- MEET CONNECTIONS ---');
    const connections = await db.select().from(meetConnections);
    console.log(`Total Meet connections: ${connections.length}`);
    for (const conn of connections) {
      console.log(`  - ${conn.googleEmail} | User: ${conn.userId} | Created: ${conn.createdAt}`);
      console.log(`    Google User ID: ${conn.googleUserId}`);
      console.log(`    Has refresh token: ${!!conn.refreshTokenEncrypted}`);
    }

    // 3. Check Meetings
    console.log('\n--- MEETINGS (last 10) ---');
    const allMeetings = await db
      .select()
      .from(meetings)
      .orderBy(desc(meetings.createdAt))
      .limit(10);
    console.log(`Total meetings in last 10: ${allMeetings.length}`);
    for (const meeting of allMeetings) {
      console.log(`  - ID: ${meeting.id} | Platform: ${meeting.platform} | Status: ${meeting.status}`);
      console.log(`    Step: ${meeting.processingStep} | Host: ${meeting.hostEmail}`);
      console.log(`    Created: ${meeting.createdAt}`);
    }

    // 4. Check Email Drafts
    console.log('\n--- EMAIL DRAFTS (last 10) ---');
    const allDrafts = await db
      .select()
      .from(drafts)
      .orderBy(desc(drafts.createdAt))
      .limit(10);
    console.log(`Total drafts in last 10: ${allDrafts.length}`);
    for (const draft of allDrafts) {
      console.log(`  - ID: ${draft.id} | Subject: ${draft.subject?.substring(0, 50)}...`);
      console.log(`    Status: ${draft.status} | Created: ${draft.createdAt}`);
    }

    // 5. Check Raw Events
    console.log('\n--- RAW EVENTS (last 10) ---');
    const events = await db
      .select()
      .from(rawEvents)
      .orderBy(desc(rawEvents.createdAt))
      .limit(10);
    console.log(`Total raw events in last 10: ${events.length}`);
    for (const event of events) {
      console.log(`  - Type: ${event.eventType} | Status: ${event.status}`);
      console.log(`    Created: ${event.createdAt}`);
    }

    // 6. Summary Statistics
    console.log('\n--- SUMMARY STATISTICS ---');
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [meetingCount] = await db.select({ count: sql<number>`count(*)` }).from(meetings);
    const [draftCount] = await db.select({ count: sql<number>`count(*)` }).from(drafts);
    const [connectionCount] = await db.select({ count: sql<number>`count(*)` }).from(meetConnections);

    console.log(`Users: ${userCount?.count || 0}`);
    console.log(`Meet Connections: ${connectionCount?.count || 0}`);
    console.log(`Meetings: ${meetingCount?.count || 0}`);
    console.log(`Email Drafts: ${draftCount?.count || 0}`);

    // 7. Check Environment
    console.log('\n--- ENVIRONMENT CHECK ---');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);
    console.log(`ENCRYPTION_SECRET: ${process.env.ENCRYPTION_SECRET ? 'SET' : 'MISSING'}`);
    console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING'}`);
    console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
    console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`CRON_SECRET: ${process.env.CRON_SECRET ? 'SET' : 'MISSING'}`);

    console.log('\n=== Diagnostic Complete ===\n');

  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
