/**
 * Quick database state check
 */

import 'dotenv/config';
import { db, users, meetings, meetConnections, zoomConnections } from '../lib/db';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('=== Database State Check ===\n');

  // Check DATABASE_URL (masked)
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log('DATABASE_URL (masked):', maskedUrl);
  console.log('');

  // Count all tables
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log('Users:', userCount[0]?.count || 0);
  } catch (e) {
    console.log('Users table error:', (e as Error).message);
  }

  try {
    const meetingCount = await db.select({ count: sql<number>`count(*)` }).from(meetings);
    console.log('Meetings:', meetingCount[0]?.count || 0);
  } catch (e) {
    console.log('Meetings table error:', (e as Error).message);
  }

  try {
    const meetConnCount = await db.select({ count: sql<number>`count(*)` }).from(meetConnections);
    console.log('Meet Connections:', meetConnCount[0]?.count || 0);
  } catch (e) {
    console.log('Meet Connections table error:', (e as Error).message);
  }

  try {
    const zoomConnCount = await db.select({ count: sql<number>`count(*)` }).from(zoomConnections);
    console.log('Zoom Connections:', zoomConnCount[0]?.count || 0);
  } catch (e) {
    console.log('Zoom Connections table error:', (e as Error).message);
  }

  // List all meet connections
  console.log('\n=== Meet Connections Details ===');
  try {
    const conns = await db.select().from(meetConnections);
    for (const conn of conns) {
      console.log(`- ${conn.googleEmail} (userId: ${conn.userId})`);
    }
    if (conns.length === 0) {
      console.log('(none)');
    }
  } catch (e) {
    console.log('Error:', (e as Error).message);
  }

  // List all zoom connections
  console.log('\n=== Zoom Connections Details ===');
  try {
    const conns = await db.select().from(zoomConnections);
    for (const conn of conns) {
      console.log(`- ${conn.zoomEmail} (userId: ${conn.userId})`);
    }
    if (conns.length === 0) {
      console.log('(none)');
    }
  } catch (e) {
    console.log('Error:', (e as Error).message);
  }

  process.exit(0);
}

check().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
