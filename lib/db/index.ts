import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a connection pool optimized for serverless
// Use small pool size since each Vercel function instance creates its own pool
// Use DATABASE_URL_POOLER for Supabase's PgBouncer (recommended for serverless)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL,
  max: 1, // Single connection per serverless instance to avoid pool exhaustion
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  // SSL required for Supabase
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for convenience
export * from './schema';

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
