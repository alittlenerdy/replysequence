/**
 * Google Meet Token Management
 *
 * Handles OAuth2 token management for user-delegated Meet access.
 * Supports token refresh and validation per-user.
 */

import { eq } from 'drizzle-orm';
import { db, meetConnections, users } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

// Configuration from environment
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Token endpoint
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Refresh buffer - refresh if token expires within 5 minutes
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Logger helper for structured JSON logging
 */
function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'meet-token',
      ...data,
    })
  );
}

/**
 * Get a valid access token for a user
 * Automatically refreshes if expired or expiring soon
 */
export async function getValidMeetToken(userId: string): Promise<string | null> {
  try {
    // Get user's Meet connection
    const [connection] = await db
      .select()
      .from(meetConnections)
      .where(eq(meetConnections.userId, userId))
      .limit(1);

    if (!connection) {
      log('warn', '[MEET-TOKEN-1] No Meet connection found for user', { userId });
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(connection.accessTokenExpiresAt);
    const needsRefresh = expiresAt.getTime() - now.getTime() < REFRESH_BUFFER_MS;

    if (!needsRefresh) {
      log('info', '[MEET-TOKEN-2] Token still valid, no refresh needed', { userId });
      // Token is still valid, decrypt and return
      return decrypt(connection.accessTokenEncrypted);
    }

    log('info', '[MEET-TOKEN-3] Token needs refresh', {
      userId,
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
    });

    // Refresh the token
    const refreshToken = decrypt(connection.refreshTokenEncrypted);
    const newTokens = await refreshAccessToken(refreshToken);

    if (!newTokens) {
      log('error', '[MEET-TOKEN-ERROR] Failed to refresh token', { userId });
      return null;
    }

    // Update tokens in database
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    const newAccessTokenEncrypted = encrypt(newTokens.access_token);

    // Google may or may not return a new refresh token
    if (newTokens.refresh_token) {
      await db
        .update(meetConnections)
        .set({
          accessTokenEncrypted: newAccessTokenEncrypted,
          accessTokenExpiresAt: newExpiresAt,
          refreshTokenEncrypted: encrypt(newTokens.refresh_token),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(meetConnections.userId, userId));
    } else {
      await db
        .update(meetConnections)
        .set({
          accessTokenEncrypted: newAccessTokenEncrypted,
          accessTokenExpiresAt: newExpiresAt,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(meetConnections.userId, userId));
    }

    log('info', '[MEET-TOKEN-4] Token refreshed successfully', {
      userId,
      newExpiresAt: newExpiresAt.toISOString(),
      hasNewRefreshToken: !!newTokens.refresh_token,
    });

    return newTokens.access_token;
  } catch (error) {
    log('error', '[MEET-TOKEN-ERROR] Error getting valid Meet token', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    log('error', '[MEET-TOKEN-ERROR] Google credentials not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', '[MEET-TOKEN-ERROR] Token refresh request failed', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    log('error', '[MEET-TOKEN-ERROR] Token refresh error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get valid Meet token for a user by Clerk ID
 */
export async function getValidMeetTokenByClerkId(clerkId: string): Promise<string | null> {
  try {
    // Find user by Clerk ID
    const [user] = await db
      .select({ id: users.id, meetConnected: users.meetConnected })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user || !user.meetConnected) {
      return null;
    }

    return getValidMeetToken(user.id);
  } catch (error) {
    log('error', '[MEET-TOKEN-ERROR] Error getting Meet token by Clerk ID', {
      clerkId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get valid Meet token for a user by email
 * Useful for webhook processing where we have the organizer's email
 */
export async function getValidMeetTokenByEmail(email: string): Promise<string | null> {
  try {
    // Find Meet connection by email
    const [connection] = await db
      .select({ userId: meetConnections.userId })
      .from(meetConnections)
      .where(eq(meetConnections.googleEmail, email))
      .limit(1);

    if (!connection) {
      log('warn', '[MEET-TOKEN-1] No Meet connection found for email', { email });
      return null;
    }

    return getValidMeetToken(connection.userId);
  } catch (error) {
    log('error', '[MEET-TOKEN-ERROR] Error getting Meet token by email', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Check if Meet token management is configured
 */
export function isMeetTokenConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}
