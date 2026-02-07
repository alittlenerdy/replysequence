#!/usr/bin/env npx tsx
/**
 * Test script to simulate the Meet poll endpoint locally
 * Run with: npx tsx scripts/test-meet-poll.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { meetConnections } from '../lib/db/schema';
import { decrypt } from '../lib/encryption';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { name?: string };
    entryPoints?: Array<{ uri?: string }>;
  };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  console.log('\n=== Meet Poll Test ===\n');

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  const db = drizzle(pool);

  try {
    // Get first Meet connection
    const connections = await db.select().from(meetConnections).limit(1);

    if (connections.length === 0) {
      console.log('No Meet connections found!');
      await pool.end();
      return;
    }

    const conn = connections[0];
    console.log(`Testing with: ${conn.googleEmail}`);

    // Decrypt and refresh token
    console.log('\n1. Decrypting refresh token...');
    const refreshToken = decrypt(conn.refreshTokenEncrypted);
    console.log('   Refresh token decrypted successfully');

    console.log('\n2. Getting access token...');
    const accessToken = await refreshAccessToken(refreshToken);
    console.log('   Access token obtained!');

    // Test with a MUCH wider time window - last 24 hours
    console.log('\n3. Fetching calendar events (last 24 hours)...');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: yesterday.toISOString(),
      timeMax: now.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    const response = await fetch(
      `${CALENDAR_API}/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.log('   Calendar API error:', error);
      await pool.end();
      return;
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.items || [];

    console.log(`\n   Found ${events.length} events in last 24 hours:\n`);

    for (const event of events) {
      console.log(`   --- Event: ${event.summary || 'No Title'} ---`);
      console.log(`       ID: ${event.id}`);
      console.log(`       Start: ${event.start?.dateTime || event.start?.date}`);
      console.log(`       End: ${event.end?.dateTime || event.end?.date}`);
      console.log(`       hangoutLink: ${event.hangoutLink || 'NONE'}`);

      if (event.conferenceData) {
        console.log('       conferenceData:');
        console.log(`         conferenceId: ${event.conferenceData.conferenceId || 'NONE'}`);
        console.log(`         conferenceSolution: ${event.conferenceData.conferenceSolution?.name || 'NONE'}`);
        if (event.conferenceData.entryPoints) {
          console.log('         entryPoints:');
          for (const ep of event.conferenceData.entryPoints) {
            console.log(`           - ${ep.uri}`);
          }
        }
      } else {
        console.log('       conferenceData: NONE');
      }

      // Check if this would pass the filter
      const hasMeetLink = event.hangoutLink || event.conferenceData?.conferenceId;
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      const hasEnded = endTime && endTime <= now;
      console.log(`       Would pass filter: hasMeetLink=${!!hasMeetLink}, hasEnded=${hasEnded}`);
      console.log('');
    }

    // Now test with 15-minute window (what the cron uses)
    console.log('\n4. Testing with 15-minute window (cron config)...');
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const endedInWindow = events.filter(e => {
      const hasMeetLink = e.hangoutLink || e.conferenceData?.conferenceId;
      const endTime = e.end?.dateTime ? new Date(e.end.dateTime) : null;
      const hasEnded = endTime && endTime <= now;
      const endedInLast15 = endTime && endTime >= fifteenMinAgo;
      return hasMeetLink && hasEnded && endedInLast15;
    });

    console.log(`   Events ended in last 15 min with Meet links: ${endedInWindow.length}`);
    for (const e of endedInWindow) {
      console.log(`   - ${e.summary} (ended: ${e.end?.dateTime})`);
    }

    console.log('\n=== Test Complete ===\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
