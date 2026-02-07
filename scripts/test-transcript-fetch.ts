#!/usr/bin/env npx tsx
/**
 * Test script to verify transcript fetching with per-user token
 * This tests the fix for the token architecture issue
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { meetConnections, meetings, transcripts } from '../lib/db/schema';
import { decrypt } from '../lib/encryption';
import {
  listTranscripts,
  listTranscriptEntries,
  listParticipants,
  getParticipantDisplayName,
  entriesToVTT,
} from '../lib/meet-api';
import { parseVTT } from '../lib/transcript/vtt-parser';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

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
  console.log('\n=== Test Transcript Fetch with Per-User Token ===\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const db = drizzle(pool);

  try {
    // Get Meet connection
    const [conn] = await db.select().from(meetConnections).limit(1);
    if (!conn) {
      console.error('No Meet connections found');
      await pool.end();
      return;
    }
    console.log(`Using account: ${conn.googleEmail}`);

    // Get the Google Meet meeting
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.platform, 'google_meet'))
      .limit(1);

    if (!meeting) {
      console.error('No Google Meet meetings found');
      await pool.end();
      return;
    }
    console.log(`Testing with meeting: ${meeting.id}`);
    console.log(`Platform meeting ID: ${meeting.platformMeetingId}`);

    // Get access token
    console.log('\n1. Getting access token...');
    const refreshToken = decrypt(conn.refreshTokenEncrypted);
    const accessToken = await refreshAccessToken(refreshToken);
    console.log('   ✓ Access token obtained');

    // Extract conference record name from platform meeting ID
    const conferenceRecordName = `conferenceRecords/${meeting.platformMeetingId?.replace('meet-', '')}`;
    console.log(`\n2. Conference record: ${conferenceRecordName}`);

    // List transcripts - NOW PASSING THE ACCESS TOKEN
    console.log('\n3. Listing transcripts (with user token)...');
    const transcriptList = await listTranscripts(conferenceRecordName, accessToken);
    console.log(`   Found ${transcriptList.length} transcript(s)`);

    if (transcriptList.length === 0) {
      console.log('   No transcripts found for this meeting');
      await pool.end();
      return;
    }

    const readyTranscript = transcriptList.find(t => t.state === 'FILE_GENERATED');
    if (!readyTranscript) {
      console.log('   No ready transcripts found. States:', transcriptList.map(t => t.state));
      await pool.end();
      return;
    }
    console.log(`   ✓ Found ready transcript: ${readyTranscript.name}`);

    // Fetch transcript entries - NOW PASSING THE ACCESS TOKEN
    console.log('\n4. Fetching transcript entries (with user token)...');
    const entries = await listTranscriptEntries(readyTranscript.name, accessToken);
    console.log(`   ✓ Got ${entries.length} entries`);

    if (entries.length === 0) {
      console.log('   No entries returned!');
      await pool.end();
      return;
    }

    // Fetch participants
    console.log('\n5. Fetching participants (with user token)...');
    const participants = await listParticipants(conferenceRecordName, accessToken);
    console.log(`   ✓ Got ${participants.length} participants`);

    const participantNames = new Map<string, string>();
    for (const p of participants) {
      participantNames.set(p.name, getParticipantDisplayName(p));
      console.log(`   - ${getParticipantDisplayName(p)}`);
    }

    // Convert to VTT
    console.log('\n6. Converting to VTT...');
    const vttContent = entriesToVTT(entries, participantNames);
    console.log(`   ✓ VTT length: ${vttContent.length} chars`);
    console.log('   Preview:', vttContent.substring(0, 300));

    // Parse VTT
    console.log('\n7. Parsing VTT...');
    const { fullText, segments, wordCount } = parseVTT(vttContent);
    console.log(`   ✓ Word count: ${wordCount}`);
    console.log(`   ✓ Segments: ${segments.length}`);
    console.log('   Content preview:', fullText.substring(0, 200));

    // Update transcript in database
    console.log('\n8. Updating transcript in database...');
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meeting.id))
      .limit(1);

    if (existingTranscript) {
      await db
        .update(transcripts)
        .set({
          content: fullText,
          vttContent,
          speakerSegments: segments,
          wordCount,
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, existingTranscript.id));
      console.log(`   ✓ Updated transcript: ${existingTranscript.id}`);
    }

    console.log('\n=== SUCCESS! Transcript fetch works with per-user token ===\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
