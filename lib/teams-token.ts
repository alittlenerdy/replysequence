/**
 * Microsoft Teams Token Management
 *
 * Handles OAuth2 token management for user-delegated Teams access.
 * Supports token refresh and validation per-user.
 */

import { eq } from 'drizzle-orm';
import { db, teamsConnections, users } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

// Configuration from environment
const CLIENT_ID = process.env.MICROSOFT_TEAMS_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_TEAMS_CLIENT_SECRET;
const TENANT_ID = process.env.MICROSOFT_TEAMS_TENANT_ID || 'common';

// Graph API endpoint
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

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
      service: 'teams-token',
      ...data,
    })
  );
}

/**
 * Get a valid access token for a user
 * Automatically refreshes if expired or expiring soon
 */
export async function getValidTeamsToken(userId: string): Promise<string | null> {
  try {
    // Get user's Teams connection
    const [connection] = await db
      .select()
      .from(teamsConnections)
      .where(eq(teamsConnections.userId, userId))
      .limit(1);

    if (!connection) {
      log('warn', 'No Teams connection found for user', { userId });
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(connection.accessTokenExpiresAt);
    const needsRefresh = expiresAt.getTime() - now.getTime() < REFRESH_BUFFER_MS;

    if (!needsRefresh) {
      // Token is still valid, decrypt and return
      return decrypt(connection.accessTokenEncrypted);
    }

    log('info', 'Token needs refresh', {
      userId,
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
    });

    // Refresh the token
    const refreshToken = decrypt(connection.refreshTokenEncrypted);
    const newTokens = await refreshAccessToken(refreshToken);

    if (!newTokens) {
      log('error', 'Failed to refresh token', { userId });
      return null;
    }

    // Update tokens in database
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    const newAccessTokenEncrypted = encrypt(newTokens.access_token);

    // Microsoft may or may not return a new refresh token
    // If a new refresh token was provided, update it too
    if (newTokens.refresh_token) {
      await db
        .update(teamsConnections)
        .set({
          accessTokenEncrypted: newAccessTokenEncrypted,
          accessTokenExpiresAt: newExpiresAt,
          refreshTokenEncrypted: encrypt(newTokens.refresh_token),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamsConnections.userId, userId));
    } else {
      await db
        .update(teamsConnections)
        .set({
          accessTokenEncrypted: newAccessTokenEncrypted,
          accessTokenExpiresAt: newExpiresAt,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamsConnections.userId, userId));
    }

    log('info', 'Token refreshed successfully', {
      userId,
      newExpiresAt: newExpiresAt.toISOString(),
      hasNewRefreshToken: !!newTokens.refresh_token,
    });

    return newTokens.access_token;
  } catch (error) {
    log('error', 'Error getting valid Teams token', {
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
    log('error', 'Microsoft Teams credentials not configured');
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
      log('error', 'Token refresh request failed', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    return await response.json();
  } catch (error) {
    log('error', 'Token refresh error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get valid Teams token for a user by Clerk ID
 */
export async function getValidTeamsTokenByClerkId(clerkId: string): Promise<string | null> {
  try {
    // Find user by Clerk ID
    const [user] = await db
      .select({ id: users.id, teamsConnected: users.teamsConnected })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user || !user.teamsConnected) {
      return null;
    }

    return getValidTeamsToken(user.id);
  } catch (error) {
    log('error', 'Error getting Teams token by Clerk ID', {
      clerkId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get valid Teams token for a user by email
 * Useful for webhook processing where we have the organizer's email
 */
export async function getValidTeamsTokenByEmail(email: string): Promise<string | null> {
  try {
    // Find Teams connection by email
    const [connection] = await db
      .select({ userId: teamsConnections.userId })
      .from(teamsConnections)
      .where(eq(teamsConnections.msEmail, email))
      .limit(1);

    if (!connection) {
      log('warn', 'No Teams connection found for email', { email });
      return null;
    }

    return getValidTeamsToken(connection.userId);
  } catch (error) {
    log('error', 'Error getting Teams token by email', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Check if Teams token management is configured
 */
export function isTeamsTokenConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}
