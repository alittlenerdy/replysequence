#!/usr/bin/env npx tsx
/**
 * Script to fix the Meet refresh token encryption
 *
 * This script takes a plain-text GOOGLE_REFRESH_TOKEN from .env.local,
 * encrypts it with the current ENCRYPTION_SECRET, and updates the database.
 *
 * Usage: npx tsx scripts/fix-meet-token.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';

// Load .env.local FIRST before anything else
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Encryption constants (must match lib/encryption.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from the master secret using PBKDF2
 */
function getKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable not configured');
  }

  return crypto.pbkdf2Sync(
    secret,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts plaintext using AES-256-GCM
 * Returns base64-encoded string containing: salt + iv + tag + ciphertext
 */
function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  return combined.toString('base64');
}

async function main() {
  console.log('\n=== Fix Meet Refresh Token Encryption ===\n');

  // Check required environment variables
  const requiredEnvVars = [
    'GOOGLE_REFRESH_TOKEN',
    'ENCRYPTION_SECRET',
    'DATABASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    console.error('\nMake sure these are set in .env.local');
    process.exit(1);
  }

  console.log('Environment check passed:');
  console.log('  GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN?.substring(0, 20) + '...');
  console.log('  ENCRYPTION_SECRET:', '[set]');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 40) + '...');

  // Encrypt the refresh token
  console.log('\nEncrypting refresh token...');
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN!;
  const encryptedToken = encrypt(refreshToken);
  console.log('Token encrypted successfully.');
  console.log('Encrypted token length:', encryptedToken.length, 'characters');

  // Import database modules after env is loaded
  console.log('\nConnecting to database...');
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { meetConnections } = await import('../lib/db/schema');
  const { eq } = await import('drizzle-orm');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(pool);

  // Find existing Meet connections
  console.log('Finding Meet connections...');
  const connections = await db
    .select({
      id: meetConnections.id,
      userId: meetConnections.userId,
      googleEmail: meetConnections.googleEmail,
      googleUserId: meetConnections.googleUserId,
    })
    .from(meetConnections)
    .limit(10);

  if (connections.length === 0) {
    console.error('\nNo Meet connections found in database.');
    console.error('Please connect Google Meet first via the app OAuth flow.');
    await pool.end();
    process.exit(1);
  }

  console.log(`\nFound ${connections.length} Meet connection(s):`);
  connections.forEach((conn, i) => {
    console.log(`  [${i + 1}] ${conn.googleEmail} (User ID: ${conn.userId})`);
  });

  // Update the first connection with the new encrypted token
  const connection = connections[0];
  console.log(`\nUpdating token for: ${connection.googleEmail}`);

  await db
    .update(meetConnections)
    .set({
      refreshTokenEncrypted: encryptedToken,
      updatedAt: new Date(),
    })
    .where(eq(meetConnections.id, connection.id));

  console.log('Token updated successfully!');

  // Verify the update worked by trying to decrypt
  console.log('\nVerifying encryption...');

  // Import decrypt for verification
  const TAG_LENGTH = 16;

  function decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, 'base64');
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  const decrypted = decrypt(encryptedToken);
  if (decrypted === refreshToken) {
    console.log('Verification passed: Token can be decrypted correctly.');
  } else {
    console.error('Verification FAILED: Decrypted token does not match!');
    await pool.end();
    process.exit(1);
  }

  console.log('\n=== Done! ===');
  console.log('\nYou can now run: npm run subscribe-meet-events');

  await pool.end();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
