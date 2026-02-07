#!/usr/bin/env npx tsx
/**
 * Script to grant Pub/Sub Publisher permission to Google's Meet service account
 * via the Google Cloud IAM API
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const PROJECT_ID = 'replysequence';
const TOPIC_NAME = 'meet-recordings';
const MEET_SERVICE_ACCOUNT = 'serviceAccount:meet-api-push@system.gserviceaccount.com';

async function getAccessToken(): Promise<string> {
  // Use the user's OAuth token to call the IAM API
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials in .env.local');
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
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function ensureTopicExists(accessToken: string): Promise<void> {
  const url = `https://pubsub.googleapis.com/v1/projects/${PROJECT_ID}/topics/${TOPIC_NAME}`;

  // First check if topic exists
  const getResponse = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (getResponse.ok) {
    console.log('Topic already exists.');
    return;
  }

  if (getResponse.status === 404) {
    console.log('Topic does not exist. Creating...');

    const createResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create topic: ${error}`);
    }

    console.log('Topic created successfully!');
    return;
  }

  const error = await getResponse.text();
  throw new Error(`Failed to check topic: ${error}`);
}

async function getCurrentPolicy(accessToken: string): Promise<any> {
  const url = `https://pubsub.googleapis.com/v1/projects/${PROJECT_ID}/topics/${TOPIC_NAME}:getIamPolicy`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get IAM policy: ${error}`);
  }

  return response.json();
}

async function setIamPolicy(accessToken: string, policy: any): Promise<any> {
  const url = `https://pubsub.googleapis.com/v1/projects/${PROJECT_ID}/topics/${TOPIC_NAME}:setIamPolicy`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ policy }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to set IAM policy: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('\n=== Grant Pub/Sub Permission to Meet Service Account ===\n');

  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  console.log('Access token obtained.');

  console.log('\nEnsuring Pub/Sub topic exists...');
  await ensureTopicExists(accessToken);

  console.log('\nFetching current IAM policy...');
  let policy = await getCurrentPolicy(accessToken);
  console.log('Current policy:', JSON.stringify(policy, null, 2));

  // Initialize bindings if not present
  if (!policy.bindings) {
    policy.bindings = [];
  }

  // Check if the binding already exists
  const publisherRole = 'roles/pubsub.publisher';
  let publisherBinding = policy.bindings.find((b: any) => b.role === publisherRole);

  if (publisherBinding) {
    if (publisherBinding.members.includes(MEET_SERVICE_ACCOUNT)) {
      console.log('\nPermission already granted to Meet service account.');
      return;
    }
    publisherBinding.members.push(MEET_SERVICE_ACCOUNT);
  } else {
    policy.bindings.push({
      role: publisherRole,
      members: [MEET_SERVICE_ACCOUNT],
    });
  }

  console.log('\nUpdating IAM policy...');
  console.log('Adding:', MEET_SERVICE_ACCOUNT);

  const updatedPolicy = await setIamPolicy(accessToken, policy);
  console.log('\nPolicy updated successfully!');
  console.log('New policy:', JSON.stringify(updatedPolicy, null, 2));

  console.log('\n=== Done! ===');
  console.log('\nNow run: npm run subscribe-meet-events');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
