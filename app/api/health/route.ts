import { NextResponse } from 'next/server';
import { checkDatabaseConnection, db, meetConnections, users, meetings } from '@/lib/db';
import { checkRedisConnection } from '@/lib/redis';
import { getQueueStats } from '@/lib/queue/transcript-queue';
import { testEncryption } from '@/lib/encryption';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  const [dbHealthy, redisHealthy, queueStats] = await Promise.all([
    checkDatabaseConnection().catch(() => false),
    checkRedisConnection().catch(() => false),
    getQueueStats().catch(() => null),
  ]);

  // Check encryption
  let encryptionHealthy = false;
  try {
    encryptionHealthy = testEncryption();
  } catch {
    encryptionHealthy = false;
  }

  // Get stats
  let stats = null;
  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [meetingCount] = await db.select({ count: sql<number>`count(*)` }).from(meetings);
    const [connectionCount] = await db.select({ count: sql<number>`count(*)` }).from(meetConnections);

    stats = {
      users: Number(userCount?.count || 0),
      meetings: Number(meetingCount?.count || 0),
      meetConnections: Number(connectionCount?.count || 0),
    };
  } catch {
    // Stats are optional
  }

  // Check critical env vars
  const envChecks = {
    encryptionSecret: !!process.env.ENCRYPTION_SECRET,
    googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    database: !!process.env.DATABASE_URL,
  };

  const allEnvHealthy = Object.values(envChecks).every(v => v);
  const status = dbHealthy && encryptionHealthy && allEnvHealthy ? 'ok' : 'degraded';

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || '0.1.0',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    latencyMs: Date.now() - startTime,
    services: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'healthy' : 'unhealthy',
      encryption: encryptionHealthy ? 'healthy' : 'unhealthy',
    },
    config: envChecks,
    queue: queueStats,
    stats,
  };

  return NextResponse.json(healthData, {
    status: status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
