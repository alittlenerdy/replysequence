/**
 * Encryption utility for securely storing OAuth tokens
 * Uses AES-256-GCM with PBKDF2 key derivation
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
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
export function encrypt(plaintext: string): string {
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

/**
 * Decrypts ciphertext using AES-256-GCM
 * Expects base64-encoded string containing: salt + iv + tag + ciphertext
 */
export function decrypt(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, 'base64');

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = getKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Test encryption/decryption functionality
 * Returns true if working correctly
 */
export function testEncryption(): boolean {
  try {
    const testValue = 'test-token-' + Date.now();
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    return testValue === decrypted;
  } catch (error) {
    console.error('[ENCRYPT-TEST] Encryption test failed:', error);
    return false;
  }
}
