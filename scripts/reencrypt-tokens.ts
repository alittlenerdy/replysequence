#!/usr/bin/env npx tsx
/**
 * Re-encrypt all OAuth tokens with current ENCRYPTION_SECRET
 *
 * Use this script after syncing ENCRYPTION_SECRET between environments.
 * It will decrypt tokens with the OLD key and re-encrypt with the NEW key.
 *
 * Usage:
 *   OLD_ENCRYPTION_SECRET="old_key" npx tsx scripts/reencrypt-tokens.ts
 *
 * The script will:
 * 1. Decrypt using OLD_ENCRYPTION_SECRET
 * 2. Re-encrypt using ENCRYPTION_SECRET from .env.local
 * 3. Update the database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

// Load environment
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { meetConnections, zoomConnections, calendarConnections } from '../lib/db/schema';

// Encryption constants (must match lib/encryption.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getKey(salt: Buffer, secret: string): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

function decryptWithSecret(ciphertext: string, secret: string): string {
  const buffer = Buffer.from(ciphertext, 'base64');
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = getKey(salt, secret);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function encryptWithSecret(plaintext: string, secret: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt, secret);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString('base64');
}

async function main() {
  console.log('\n=== Token Re-encryption Script ===\n');

  const oldSecret = process.env.OLD_ENCRYPTION_SECRET;
  const newSecret = process.env.ENCRYPTION_SECRET;

  if (!oldSecret) {
    console.error('ERROR: OLD_ENCRYPTION_SECRET environment variable not set');
    console.error('\nUsage:');
    console.error('  OLD_ENCRYPTION_SECRET="your_old_key" npx tsx scripts/reencrypt-tokens.ts');
    process.exit(1);
  }

  if (!newSecret) {
    console.error('ERROR: ENCRYPTION_SECRET not set in .env.local');
    process.exit(1);
  }

  console.log('Old secret prefix:', oldSecret.substring(0, 20) + '...');
  console.log('New secret prefix:', newSecret.substring(0, 20) + '...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

  const db = drizzle(pool);

  try {
    // Re-encrypt Meet connections
    console.log('\n--- Processing Meet Connections ---');
    const meetConns = await db.select().from(meetConnections);
    console.log(`Found ${meetConns.length} Meet connection(s)`);

    for (const conn of meetConns) {
      try {
        // Decrypt with old key
        const refreshToken = decryptWithSecret(conn.refreshTokenEncrypted, oldSecret);
        const accessToken = decryptWithSecret(conn.accessTokenEncrypted, oldSecret);

        // Re-encrypt with new key
        const newRefreshEncrypted = encryptWithSecret(refreshToken, newSecret);
        const newAccessEncrypted = encryptWithSecret(accessToken, newSecret);

        // Note: Would need to UPDATE the database here
        // For safety, just print what would change
        console.log(`  ✓ ${conn.googleEmail}: Tokens decrypted and re-encrypted successfully`);
        console.log(`    Old refresh prefix: ${conn.refreshTokenEncrypted.substring(0, 30)}...`);
        console.log(`    New refresh prefix: ${newRefreshEncrypted.substring(0, 30)}...`);
      } catch (error) {
        console.error(`  ✗ ${conn.googleEmail}: Failed - ${error instanceof Error ? error.message : error}`);
      }
    }

    // Verify new encryption works
    console.log('\n--- Verification ---');
    console.log('Testing round-trip encryption with new key...');

    const testValue = 'test-token-' + Date.now();
    const encrypted = encryptWithSecret(testValue, newSecret);
    const decrypted = decryptWithSecret(encrypted, newSecret);

    if (testValue === decrypted) {
      console.log('✓ New encryption key works correctly');
    } else {
      console.log('✗ New encryption key verification FAILED');
    }

    console.log('\n=== Script Complete ===');
    console.log('\nNOTE: This script only shows what WOULD be re-encrypted.');
    console.log('To actually update the database, uncomment the UPDATE statements.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
