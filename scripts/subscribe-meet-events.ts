#!/usr/bin/env npx tsx
/**
 * Script to create a Workspace Events subscription for Google Meet
 *
 * Usage: npm run subscribe-meet-events
 *
 * Prerequisites:
 * - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 * - A valid refresh token (from OAuth flow) in the database
 * - Pub/Sub topic already created in Google Cloud
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local explicitly BEFORE any other imports that might use env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug: show what was loaded
console.log('Loading environment from:', path.resolve(process.cwd(), '.env.local'));
console.log('GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'Yes (starts with ' + process.env.GOOGLE_CLIENT_ID.substring(0, 12) + '...)' : 'NO');

import { db } from '../lib/db';
import { users, meetConnections } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../lib/encryption';

// Configuration
const WORKSPACE_EVENTS_API = 'https://workspaceevents.googleapis.com/v1';
const PUBSUB_TOPIC = 'projects/replysequence/topics/meet-recordings';
const EVENT_TYPES = [
  'google.workspace.meet.recording.v2.fileGenerated',
  'google.workspace.meet.transcript.v2.fileGenerated',
];
const SUBSCRIPTION_TTL = '604800s'; // 7 days

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface SubscriptionResponse {
  name: string;
  uid: string;
  targetResource: string;
  eventTypes: string[];
  notificationEndpoint: {
    pubsubTopic: string;
  };
  state: string;
  expireTime: string;
  ttl: string;
  createTime: string;
}

interface ErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

async function createSubscription(
  accessToken: string,
  googleUserId: string
): Promise<SubscriptionResponse> {
  const targetResource = `//cloudidentity.googleapis.com/users/${googleUserId}`;

  const requestBody = {
    targetResource,
    eventTypes: EVENT_TYPES,
    notificationEndpoint: {
      pubsubTopic: PUBSUB_TOPIC,
    },
    ttl: SUBSCRIPTION_TTL,
    payloadOptions: {
      includeResource: false,
    },
  };

  console.log('\nCreating subscription with:');
  console.log('  Target resource:', targetResource);
  console.log('  Event types:', EVENT_TYPES.join(', '));
  console.log('  Pub/Sub topic:', PUBSUB_TOPIC);
  console.log('  TTL:', SUBSCRIPTION_TTL);

  const response = await fetch(`${WORKSPACE_EVENTS_API}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new Error(`API error ${error.error.code}: ${error.error.message}`);
  }

  return data as SubscriptionResponse;
}

async function main() {
  console.log('=== Google Meet Workspace Events Subscription ===\n');

  // Check environment with detailed error messages
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ENCRYPTION_SECRET',
    'DATABASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('\nMissing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    console.error('\nMake sure these are set in .env.local');
    console.error('Current working directory:', process.cwd());
    console.error('\nAvailable env vars (GOOGLE_*):');
    Object.keys(process.env)
      .filter((k) => k.startsWith('GOOGLE'))
      .forEach((k) => console.error(`  - ${k}=${process.env[k]?.substring(0, 20)}...`));
    process.exit(1);
  }

  console.log('\nEnvironment check passed:');
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 15) + '...');
  console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET?.substring(0, 8) + '...');
  console.log('  ENCRYPTION_SECRET: [set]');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  console.log();

  // Find a user with Meet connected
  console.log('Looking for users with Google Meet connected...');

  const connections = await db
    .select({
      id: meetConnections.id,
      userId: meetConnections.userId,
      googleUserId: meetConnections.googleUserId,
      googleEmail: meetConnections.googleEmail,
      refreshTokenEncrypted: meetConnections.refreshTokenEncrypted,
    })
    .from(meetConnections)
    .limit(10);

  if (connections.length === 0) {
    console.error('\nNo Meet connections found. Please connect Google Meet first via the app.');
    process.exit(1);
  }

  console.log(`\nFound ${connections.length} Meet connection(s):\n`);

  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    console.log(`  [${i + 1}] ${conn.googleEmail} (Google User ID: ${conn.googleUserId})`);
  }

  // Use first connection (or could prompt for selection)
  const connection = connections[0];
  console.log(`\nUsing: ${connection.googleEmail}`);

  // Decrypt refresh token
  if (!connection.refreshTokenEncrypted) {
    console.error('\nError: No refresh token found for this connection.');
    console.error('Please reconnect Google Meet to get a new refresh token.');
    process.exit(1);
  }

  console.log('\nDecrypting refresh token...');
  const refreshToken = decrypt(connection.refreshTokenEncrypted);

  // Get access token
  console.log('Getting access token...');
  const accessToken = await getAccessToken(refreshToken);
  console.log('Access token obtained.');

  // Create subscription
  console.log('\nCreating Workspace Events subscription...');

  try {
    const subscription = await createSubscription(accessToken, connection.googleUserId);

    console.log('\n=== Subscription Created Successfully ===\n');
    console.log('Subscription ID:', subscription.name);
    console.log('UID:', subscription.uid);
    console.log('State:', subscription.state);
    console.log('Expires:', subscription.expireTime);
    console.log('Created:', subscription.createTime);
    console.log('\nEvent Types:');
    subscription.eventTypes.forEach((et) => console.log(`  - ${et}`));
    console.log('\nPub/Sub Topic:', subscription.notificationEndpoint.pubsubTopic);

    // Save to database
    console.log('\nSaving subscription to database...');

    const { meetEventSubscriptions } = await import('../lib/db/schema');

    await db.insert(meetEventSubscriptions).values({
      userId: connection.userId,
      subscriptionName: subscription.name,
      targetResource: subscription.targetResource,
      eventTypes: subscription.eventTypes,
      status: 'active',
      expireTime: new Date(subscription.expireTime),
    }).onConflictDoUpdate({
      target: meetEventSubscriptions.userId,
      set: {
        subscriptionName: subscription.name,
        targetResource: subscription.targetResource,
        eventTypes: subscription.eventTypes,
        status: 'active',
        expireTime: new Date(subscription.expireTime),
        lastRenewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Subscription saved to database.');
    console.log('\n=== Done! ===');
    console.log('\nYou can now test by:');
    console.log('1. Starting a Google Meet with recording enabled');
    console.log('2. End the meeting and wait for transcript to process');
    console.log('3. Check Vercel logs for webhook events');
    console.log('4. Check the dashboard for the new meeting and draft');

  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      console.log('\nSubscription already exists for this user.');
      console.log('Use the renew endpoint or delete the existing subscription first.');
    } else {
      console.error('\nFailed to create subscription:', error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
