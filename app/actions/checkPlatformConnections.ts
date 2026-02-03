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

  console.log('[CHECK-CONNECTION] Starting check', { clerkUserId: userId });

  if (!userId) {
    console.log('[CHECK-CONNECTION] No userId from Clerk auth');
    return {
      connected: false,
      platforms: { zoom: false, teams: false, meet: false },
    };
  }

  // Try to find existing user
  const [existingUser] = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      zoomConnected: users.zoomConnected,
      teamsConnected: users.teamsConnected,
      meetConnected: users.meetConnected,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  console.log('[CHECK-CONNECTION] User query result', {
    found: !!existingUser,
    userId: existingUser?.id,
    clerkId: existingUser?.clerkId,
    zoomConnected: existingUser?.zoomConnected,
    teamsConnected: existingUser?.teamsConnected,
    meetConnected: existingUser?.meetConnected,
  });

  if (existingUser) {
    // Database stores boolean values directly
    const zoomConnected = existingUser.zoomConnected === true;
    const teamsConnected = existingUser.teamsConnected === true;
    const meetConnected = existingUser.meetConnected === true;
    const hasConnection = zoomConnected || teamsConnected || meetConnected;

    console.log('[CHECK-CONNECTION] Connection status', {
      zoomConnected,
      teamsConnected,
      meetConnected,
      hasConnection,
    });

    // Get Zoom email if connected
    let zoomEmail: string | undefined;
    if (zoomConnected) {
      const [connection] = await db
        .select({ zoomEmail: zoomConnections.zoomEmail })
        .from(zoomConnections)
        .where(eq(zoomConnections.userId, existingUser.id))
        .limit(1);
      zoomEmail = connection?.zoomEmail;
      console.log('[CHECK-CONNECTION] Zoom connection found', { zoomEmail });
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
  console.log('[CHECK-CONNECTION] Creating new user for clerkId:', userId);
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const name = clerkUser?.fullName || clerkUser?.firstName || '';

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      name,
      zoomConnected: false,
      teamsConnected: false,
      meetConnected: false,
    })
    .returning({ id: users.id });
  console.log('[CHECK-CONNECTION] Created new user', { userId: newUser.id });

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
    // Build update object based on platform (boolean values)
    const baseUpdate = { updatedAt: new Date() };

    let updateData;
    switch (platform) {
      case 'zoom':
        updateData = { ...baseUpdate, zoomConnected: connected };
        break;
      case 'teams':
        updateData = { ...baseUpdate, teamsConnected: connected };
        break;
      case 'meet':
        updateData = { ...baseUpdate, meetConnected: connected };
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
