import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';
import { checkRedisConnection } from '@/lib/redis';
import { getQueueStats } from '@/lib/queue/transcript-queue';

export async function GET() {
  const [dbHealthy, redisHealthy, queueStats] = await Promise.all([
    checkDatabaseConnection().catch(() => false),
    checkRedisConnection().catch(() => false),
    getQueueStats().catch(() => null),
  ]);

  const status = dbHealthy && redisHealthy ? 'ok' : 'degraded';

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'healthy' : 'unhealthy',
    },
    queue: queueStats,
  };

  return NextResponse.json(healthData, {
    status: status === 'ok' ? 200 : 503,
  });
}
