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
 * Helper: Try to find an existing subscription on Google's side.
 * Uses multiple filter strategies since the combined filter can fail
 * due to operator precedence or OAuth client mismatch.
 */
async function findExistingGoogleSubscription(
  accessToken: string,
  targetResource: string
): Promise<WorkspaceEventsSubscription | null> {
  // Strategy 1: Filter by event types with parentheses + target_resource
  const eventTypeFilter = EVENT_TYPES.map(e => `event_types:"${e}"`).join(' OR ');
  const fullFilter = `(${eventTypeFilter}) AND target_resource="${targetResource}"`;

  const resp1 = await fetch(
    `${EVENTS_API_BASE}/subscriptions?filter=${encodeURIComponent(fullFilter)}&pageSize=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (resp1.ok) {
    const data = await resp1.json();
    const found = (data.subscriptions || []).find(
      (s: WorkspaceEventsSubscription) => s.targetResource === targetResource
    );
    if (found) return found;
  }

  // Strategy 2: Filter by single event type only (broadest search)
  const simpleFilter = `event_types:"${EVENT_TYPES[0]}"`;
  const resp2 = await fetch(
    `${EVENTS_API_BASE}/subscriptions?filter=${encodeURIComponent(simpleFilter)}&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (resp2.ok) {
    const data = await resp2.json();
    const found = (data.subscriptions || []).find(
      (s: WorkspaceEventsSubscription) => s.targetResource === targetResource
    );
    if (found) return found;
  }

  return null;
}

/**
 * Helper: Delete a subscription on Google's side by name.
 * Uses allowMissing=true so it succeeds even if already deleted.
 */
async function deleteGoogleSubscription(
  accessToken: string,
  subscriptionName: string
): Promise<boolean> {
  const resp = await fetch(
    `${EVENTS_API_BASE}/${subscriptionName}?allowMissing=true`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return resp.ok;
}

/**
 * Helper: Store or update subscription in our database.
 */
async function upsertSubscription(
  userId: string,
  sub: WorkspaceEventsSubscription,
  existingRecord: boolean
): Promise<void> {
  const expireTime = new Date(sub.expireTime);
  if (existingRecord) {
    await db
      .update(meetEventSubscriptions)
      .set({
        subscriptionName: sub.name,
        targetResource: sub.targetResource,
        eventTypes: sub.eventTypes,
        status: 'active',
        expireTime,
        lastRenewedAt: new Date(),
        renewalFailures: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(meetEventSubscriptions.userId, userId));
  } else {
    await db.insert(meetEventSubscriptions).values({
      userId,
      subscriptionName: sub.name,
      targetResource: sub.targetResource,
      eventTypes: sub.eventTypes,
      status: 'active',
      expireTime,
    });
  }
}

/**
 * POST /api/meet/subscribe-events
 * Creates a Workspace Events API subscription for the authenticated user.
 * Idempotent: if a subscription already exists, finds and stores it.
 */
export async function POST() {
  const startTime = Date.now();

  try {
    // Step 1: Authenticate user via Clerk
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: 'Google Meet not connected. Please connect Google Meet first.' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Meet connection not found' },
        { status: 400 }
      );
    }

    // Check if we already have an active subscription in our DB
    const [existingDbSub] = await db
      .select()
      .from(meetEventSubscriptions)
      .where(eq(meetEventSubscriptions.userId, user.id))
      .limit(1);

    if (existingDbSub && existingDbSub.status === 'active') {
      return NextResponse.json({
        success: true,
        existing: true,
        subscription: {
          name: existingDbSub.subscriptionName,
          expireTime: existingDbSub.expireTime,
          status: existingDbSub.status,
        },
      });
    }

    // Step 3: Get valid access token
    const accessToken = await getValidMeetToken(user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get valid access token. Please reconnect Google Meet.' },
        { status: 401 }
      );
    }

    const targetResource = `//cloudidentity.googleapis.com/users/${meetConnection.googleUserId}`;
    const hasDbRecord = !!existingDbSub;

    // Step 4: Check for existing subscription on Google's side
    const existingGoogleSub = await findExistingGoogleSubscription(accessToken, targetResource);

    if (existingGoogleSub) {
      log('info', '[MEET-SUBSCRIBE] Found existing Google subscription', {
        name: existingGoogleSub.name,
        state: existingGoogleSub.state,
      });
      await upsertSubscription(user.id, existingGoogleSub, hasDbRecord);
      return NextResponse.json({
        success: true,
        existing: true,
        subscription: {
          name: existingGoogleSub.name,
          expireTime: existingGoogleSub.expireTime,
          state: existingGoogleSub.state,
        },
      });
    }

    // Step 5: No existing subscription found — create one
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

    log('info', '[MEET-SUBSCRIBE] Creating new subscription', {
      targetResource,
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

    // Handle 409: subscription exists but list couldn't find it (OAuth client mismatch).
    // Delete the orphaned subscription and retry creation once.
    if (response.status === 409) {
      log('warn', '[MEET-SUBSCRIBE] 409 conflict — deleting orphaned subscription and retrying');

      // Try to find it one more time with broadest possible filter
      const orphan = await findExistingGoogleSubscription(accessToken, targetResource);
      if (orphan) {
        await deleteGoogleSubscription(accessToken, orphan.name);
      }

      // Retry creation
      const retryResponse = await fetch(`${EVENTS_API_BASE}/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionRequest),
      });

      if (!retryResponse.ok) {
        const retryError = await retryResponse.text();
        log('error', '[MEET-SUBSCRIBE] Retry after 409 also failed', {
          status: retryResponse.status,
          body: retryError.substring(0, 500),
        });

        // If still 409, the subscription was created by a different OAuth client
        // and we can't list or delete it. User must deauthorize the app in Google
        // Account settings and reconnect.
        if (retryResponse.status === 409) {
          return NextResponse.json({
            error: 'A subscription exists from a previous session that cannot be managed. Please go to myaccount.google.com > Security > Third-party apps, remove ReplySequence access, then reconnect Google Meet.',
          }, { status: 409 });
        }

        return NextResponse.json(
          { error: `Failed to create subscription (${retryResponse.status})` },
          { status: retryResponse.status }
        );
      }

      // Retry succeeded
      const retryData: WorkspaceEventsSubscription = await retryResponse.json();
      log('info', '[MEET-SUBSCRIBE] Subscription created on retry', {
        name: retryData.name,
        state: retryData.state,
      });
      await upsertSubscription(user.id, retryData, hasDbRecord);
      return NextResponse.json({
        success: true,
        subscription: {
          name: retryData.name,
          targetResource: retryData.targetResource,
          eventTypes: retryData.eventTypes,
          expireTime: retryData.expireTime,
          state: retryData.state,
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      log('error', '[MEET-SUBSCRIBE] Workspace Events API error', {
        status: response.status,
        body: errorText.substring(0, 500),
      });

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Missing required permissions. Please reconnect Google Meet with correct scopes.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create subscription (${response.status})` },
        { status: response.status }
      );
    }

    // Step 6: Store the newly created subscription
    const subscriptionData: WorkspaceEventsSubscription = await response.json();

    log('info', '[MEET-SUBSCRIBE] Subscription created', {
      name: subscriptionData.name,
      state: subscriptionData.state,
      duration: Date.now() - startTime,
    });

    await upsertSubscription(user.id, subscriptionData, hasDbRecord);

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
