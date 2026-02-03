'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users, zoomConnections } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface PlatformConnectionsResult {
  connected: boolean;
  platforms: {
    zoom: boolean;
    teams: boolean;
    meet: boolean;
  };
  userId?: string;
  zoomEmail?: string;
}

/**
 * Check if the current user has connected any meeting platforms.
 * Creates user record if it doesn't exist.
 */
export async function checkPlatformConnections(): Promise<PlatformConnectionsResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      connected: false,
      platforms: { zoom: false, teams: false, meet: false },
    };
  }

  // Try to find existing user
  const [existingUser] = await db
    .select({
      id: users.id,
      zoomConnected: users.zoomConnected,
      teamsConnected: users.teamsConnected,
      meetConnected: users.meetConnected,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existingUser) {
    const zoomConnected = existingUser.zoomConnected === 'true';
    const teamsConnected = existingUser.teamsConnected === 'true';
    const meetConnected = existingUser.meetConnected === 'true';
    const hasConnection = zoomConnected || teamsConnected || meetConnected;

    // Get Zoom email if connected
    let zoomEmail: string | undefined;
    if (zoomConnected) {
      const [connection] = await db
        .select({ zoomEmail: zoomConnections.zoomEmail })
        .from(zoomConnections)
        .where(eq(zoomConnections.userId, existingUser.id))
        .limit(1);
      zoomEmail = connection?.zoomEmail;
    }

    return {
      connected: hasConnection,
      platforms: {
        zoom: zoomConnected,
        teams: teamsConnected,
        meet: meetConnected,
      },
      userId: existingUser.id,
      zoomEmail,
    };
  }

  // User doesn't exist, create them
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const name = clerkUser?.fullName || clerkUser?.firstName || '';

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      name,
      zoomConnected: 'false',
      teamsConnected: 'false',
      meetConnected: 'false',
    })
    .returning({ id: users.id });

  return {
    connected: false,
    platforms: { zoom: false, teams: false, meet: false },
    userId: newUser.id,
  };
}

/**
 * Update platform connection status for the current user.
 */
export async function updatePlatformConnection(
  platform: 'zoom' | 'teams' | 'meet',
  connected: boolean
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Build update object based on platform
    const baseUpdate = { updatedAt: new Date() };

    let updateData;
    switch (platform) {
      case 'zoom':
        updateData = { ...baseUpdate, zoomConnected: connected ? 'true' : 'false' };
        break;
      case 'teams':
        updateData = { ...baseUpdate, teamsConnected: connected ? 'true' : 'false' };
        break;
      case 'meet':
        updateData = { ...baseUpdate, meetConnected: connected ? 'true' : 'false' };
        break;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.clerkId, userId));

    console.log(JSON.stringify({
      level: 'info',
      message: 'Platform connection updated',
      platform,
      connected,
      userId,
    }));

    return { success: true };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to update platform connection',
      platform,
      error: error instanceof Error ? error.message : String(error),
    }));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
