/**
 * GET /api/integrations/hubspot/properties
 * Fetches available HubSpot meeting properties from the user's portal
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, hubspotConnections } from '@/lib/db';
import { getHubSpotMeetingProperties, refreshHubSpotToken } from '@/lib/hubspot';
import { decrypt, encrypt } from '@/lib/encryption';

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [connection] = await db
      .select()
      .from(hubspotConnections)
      .where(eq(hubspotConnections.userId, user.id))
      .limit(1);

    if (!connection) {
      return NextResponse.json({ error: 'HubSpot not connected' }, { status: 404 });
    }

    // Decrypt and possibly refresh access token
    let accessToken = decrypt(connection.accessTokenEncrypted);

    if (connection.accessTokenExpiresAt < new Date()) {
      try {
        const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);
        const refreshed = await refreshHubSpotToken(refreshTokenDecrypted);
        accessToken = refreshed.accessToken;

        await db
          .update(hubspotConnections)
          .set({
            accessTokenEncrypted: encrypt(refreshed.accessToken),
            refreshTokenEncrypted: encrypt(refreshed.refreshToken),
            accessTokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            lastRefreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(hubspotConnections.id, connection.id));
      } catch (refreshError) {
        console.error('[HUBSPOT-PROPERTIES] Token refresh failed:', refreshError);
        return NextResponse.json(
          { error: 'HubSpot token expired. Please reconnect in Settings.' },
          { status: 401 }
        );
      }
    }

    const properties = await getHubSpotMeetingProperties(accessToken);

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('[HUBSPOT-PROPERTIES] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
