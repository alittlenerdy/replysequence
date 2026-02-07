/**
 * Debug endpoint to test encryption consistency
 * DELETE THIS IN PRODUCTION after debugging
 */

import { NextResponse } from 'next/server';
import { encrypt, decrypt, testEncryption } from '@/lib/encryption';

export async function GET() {
  const testValue = 'test-' + Date.now();

  try {
    // Test basic encryption/decryption
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    const matches = testValue === decrypted;

    // Check if ENCRYPTION_SECRET is set
    const hasSecret = !!process.env.ENCRYPTION_SECRET;
    const secretPrefix = process.env.ENCRYPTION_SECRET?.substring(0, 20) || 'NOT SET';

    return NextResponse.json({
      status: matches ? 'OK' : 'MISMATCH',
      hasEncryptionSecret: hasSecret,
      secretPrefix: secretPrefix + '...',
      testPassed: testEncryption(),
      environment: process.env.VERCEL_ENV || 'local',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      hasEncryptionSecret: !!process.env.ENCRYPTION_SECRET,
      secretPrefix: (process.env.ENCRYPTION_SECRET?.substring(0, 20) || 'NOT SET') + '...',
      environment: process.env.VERCEL_ENV || 'local',
    }, { status: 500 });
  }
}
