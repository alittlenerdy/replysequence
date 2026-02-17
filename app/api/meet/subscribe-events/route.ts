import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, meetConnections, meetEventSubscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getValidMeetToken } from '@/lib/meet-token';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Workspace Events API endpoint
const EVENTS_API_BASE = 'https://workspaceevents.googleapis.com/v1';

// Pub/Sub topic for Meet events
const PUBSUB_TOPIC = 'projects/replysequence/topics/meet-recordings';

// Event types to subscribe to
const EVENT_TYPES = [
  'google.workspace.meet.recording.v2.fileGenerated',
  'google.workspace.meet.transcript.v2.fileGenerated',
];

// TTL for subscription (7 days in seconds)
const SUBSCRIPTION_TTL = '604800s';

/**
 * Structured logging helper
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
      service: 'meet-subscribe',
      ...data,
    })
  );
}

interface WorkspaceEventsSubscription {
  name: string;
  uid: string;
  targetResource: string;
  eventTypes: string[];
  notificationEndpoint: {
    pubsubTopic: string;
  };
  state: string;
  expireTime: string;
  ttl: string;
  createTime: string;
}

interface WorkspaceEventsError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * POST /api/meet/subscribe-events
 * Creates a Workspace Events API subscription for the authenticated user
 */
export async function POST() {
  const startTime = Date.now();
  console.log('[MEET-SUBSCRIBE] POST handler invoked');

  try {
    // Step 1: Authenticate user via Clerk
    const { userId: clerkId } = await auth();
    console.log('[MEET-SUBSCRIBE] Auth result:', { clerkId: clerkId || 'null' });

    if (!clerkId) {
      log('warn', '[MEET-SUBSCRIBE-1] No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log('info', '[MEET-SUBSCRIBE-1] User authenticated', { clerkId });

    // Step 2: Get user and their Meet connection
    const [user] = await db
      .select({
        id: users.id,
        meetConnected: users.meetConnected,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user || !user.meetConnected) {
      log('warn', '[MEET-SUBSCRIBE-2] No Meet connection for user', { clerkId });
      return NextResponse.json(
        { error: 'Google Meet not connected. Please connect Google Meet first.' },
        { status: 400 }
      );
    }

    // Get the Meet connection details
    const [meetConnection] = await db
      .select({
        userId: meetConnections.userId,
        googleUserId: meetConnections.googleUserId,
        googleEmail: meetConnections.googleEmail,
      })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id))
      .limit(1);

    if (!meetConnection) {
      log('error', '[MEET-SUBSCRIBE-2] Meet connection record not found', { userId: user.id });
      return NextResponse.json(
        { error: 'Meet connection not found' },
        { status: 400 }
      );
    }

    log('info', '[MEET-SUBSCRIBE-2] Meet connection found', {
      googleEmail: meetConnection.googleEmail,
      googleUserId: meetConnection.googleUserId,
    });

    // Check if subscription already exists
    const [existingSubscription] = await db
      .select()
      .from(meetEventSubscriptions)
      .where(eq(meetEventSubscriptions.userId, user.id))
      .limit(1);

    if (existingSubscription && existingSubscription.status === 'active') {
      log('info', '[MEET-SUBSCRIBE-2] Active subscription already exists', {
        subscriptionName: existingSubscription.subscriptionName,
        expireTime: existingSubscription.expireTime,
      });

      return NextResponse.json({
        success: true,
        existing: true,
        subscription: {
          name: existingSubscription.subscriptionName,
          expireTime: existingSubscription.expireTime,
          status: existingSubscription.status,
        },
      });
    }

    // Step 3: Get valid access token
    const accessToken = await getValidMeetToken(user.id);

    if (!accessToken) {
      log('error', '[MEET-SUBSCRIBE-3] Failed to get valid access token', { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to get valid access token. Please reconnect Google Meet.' },
        { status: 401 }
      );
    }

    log('info', '[MEET-SUBSCRIBE-3] Token obtained successfully');

    // Step 4: Create subscription via Workspace Events API
    const targetResource = `//cloudidentity.googleapis.com/users/${meetConnection.googleUserId}`;

    const subscriptionRequest = {
      targetResource,
      eventTypes: EVENT_TYPES,
      notificationEndpoint: {
        pubsubTopic: PUBSUB_TOPIC,
      },
      ttl: SUBSCRIPTION_TTL,
      payloadOptions: {
        includeResource: false,
      },
    };

    log('info', '[MEET-SUBSCRIBE-4] Calling Workspace Events API', {
      targetResource,
      eventTypes: EVENT_TYPES,
      pubsubTopic: PUBSUB_TOPIC,
    });

    const response = await fetch(`${EVENTS_API_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionRequest),
    });

    if (!response.ok) {
      const errorData: WorkspaceEventsError = await response.json().catch(() => ({
        error: { code: response.status, message: response.statusText, status: 'UNKNOWN' },
      }));

      log('error', '[MEET-SUBSCRIBE-4] Workspace Events API error', {
        status: response.status,
        error: errorData.error?.message,
        code: errorData.error?.code,
      });

      // Handle specific error cases
      if (response.status === 409) {
        // Subscription exists on Google's side but not in our DB — list and store it
        log('info', '[MEET-SUBSCRIBE-4] 409 conflict — listing existing subscriptions');
        try {
          const listResponse = await fetch(
            `${EVENTS_API_BASE}/subscriptions`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const listText = await listResponse.text();
          console.log('[MEET-SUBSCRIBE-4] List response:', listResponse.status, listText.substring(0, 500));
          if (listResponse.ok) {
            const listData = JSON.parse(listText);
            // Find subscription matching our target resource
            const existing = (listData.subscriptions || []).find(
              (s: WorkspaceEventsSubscription) => s.targetResource === targetResource
            ) || listData.subscriptions?.[0];
            if (existing) {
              const expireTime = new Date(existing.expireTime);
              if (existingSubscription) {
                await db
                  .update(meetEventSubscriptions)
                  .set({
                    subscriptionName: existing.name,
                    targetResource: existing.targetResource,
                    eventTypes: existing.eventTypes,
                    status: 'active',
                    expireTime,
                    lastRenewedAt: new Date(),
                    renewalFailures: 0,
                    lastError: null,
                    updatedAt: new Date(),
                  })
                  .where(eq(meetEventSubscriptions.userId, user.id));
              } else {
                await db.insert(meetEventSubscriptions).values({
                  userId: user.id,
                  subscriptionName: existing.name,
                  targetResource: existing.targetResource,
                  eventTypes: existing.eventTypes,
                  status: 'active',
                  expireTime,
                });
              }
              log('info', '[MEET-SUBSCRIBE-4] Stored existing subscription from Google', {
                subscriptionName: existing.name,
                expireTime: existing.expireTime,
              });
              return NextResponse.json({
                success: true,
                existing: true,
                subscription: {
                  name: existing.name,
                  expireTime: existing.expireTime,
                  state: existing.state,
                },
              });
            }
          }
        } catch (listError) {
          log('error', '[MEET-SUBSCRIBE-4] Failed to list existing subscriptions', {
            error: listError instanceof Error ? listError.message : String(listError),
          });
        }
        return NextResponse.json(
          { error: 'Subscription already exists for this user' },
          { status: 409 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Missing required permissions. Please reconnect Google Meet with correct scopes.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create subscription: ${errorData.error?.message}` },
        { status: response.status }
      );
    }

    const subscriptionData: WorkspaceEventsSubscription = await response.json();

    log('info', '[MEET-SUBSCRIBE-5] Subscription created', {
      subscriptionName: subscriptionData.name,
      expireTime: subscriptionData.expireTime,
      state: subscriptionData.state,
    });

    // Step 5: Store subscription in database
    const expireTime = new Date(subscriptionData.expireTime);

    if (existingSubscription) {
      // Update existing record
      await db
        .update(meetEventSubscriptions)
        .set({
          subscriptionName: subscriptionData.name,
          targetResource: subscriptionData.targetResource,
          eventTypes: subscriptionData.eventTypes,
          status: 'active',
          expireTime,
          lastRenewedAt: new Date(),
          renewalFailures: 0,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(meetEventSubscriptions.userId, user.id));
    } else {
      // Insert new record
      await db.insert(meetEventSubscriptions).values({
        userId: user.id,
        subscriptionName: subscriptionData.name,
        targetResource: subscriptionData.targetResource,
        eventTypes: subscriptionData.eventTypes,
        status: 'active',
        expireTime,
      });
    }

    log('info', '[MEET-SUBSCRIBE-6] Subscription stored in database', {
      subscriptionName: subscriptionData.name,
      expireTime: expireTime.toISOString(),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        name: subscriptionData.name,
        targetResource: subscriptionData.targetResource,
        eventTypes: subscriptionData.eventTypes,
        expireTime: subscriptionData.expireTime,
        state: subscriptionData.state,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', '[MEET-SUBSCRIBE-ERROR] Unexpected error', {
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/meet/subscribe-events
 * Returns current subscription status for the authenticated user
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(meetEventSubscriptions)
      .where(eq(meetEventSubscriptions.userId, user.id))
      .limit(1);

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
      });
    }

    const now = new Date();
    const isExpired = subscription.expireTime < now;
    const isExpiringSoon = !isExpired && subscription.expireTime < new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        name: subscription.subscriptionName,
        status: subscription.status,
        expireTime: subscription.expireTime,
        isExpired,
        isExpiringSoon,
        lastRenewedAt: subscription.lastRenewedAt,
        renewalFailures: subscription.renewalFailures,
        lastError: subscription.lastError,
      },
    });
  } catch (error) {
    log('error', '[MEET-SUBSCRIBE-GET] Error fetching subscription', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
