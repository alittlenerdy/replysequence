import { NextRequest, NextResponse } from 'next/server';
import { db, teamsConnections } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { renewTeamsSubscription, createTeamsSubscription } from '@/lib/teams-api';
import { getValidTeamsToken } from '@/lib/teams-token';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
      service: 'teams-lifecycle',
      ...data,
    })
  );
}

/**
 * Handle GET request - Subscription validation
 */
export async function GET(request: NextRequest) {
  const validationToken = request.nextUrl.searchParams.get('validationToken');

  if (validationToken) {
    log('info', 'Teams lifecycle validation via GET', {
      tokenLength: validationToken.length,
    });
    return new NextResponse(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  log('warn', 'GET request without validationToken');
  return NextResponse.json({ error: 'Missing validationToken' }, { status: 400 });
}

/**
 * Handle POST request - Lifecycle notifications and validation
 */
export async function POST(request: NextRequest) {
  // Check for validation token in query
  const validationToken = request.nextUrl.searchParams.get('validationToken');
  if (validationToken) {
    log('info', 'Teams lifecycle validation via POST query param', {
      tokenLength: validationToken.length,
    });
    return new NextResponse(validationToken, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const rawBody = await request.text();

    // Check if body contains validationToken
    if (rawBody.includes('validationToken')) {
      try {
        const bodyJson = JSON.parse(rawBody);
        if (bodyJson.validationToken) {
          log('info', 'Teams lifecycle validation via POST body', {
            tokenLength: bodyJson.validationToken.length,
          });
          return new NextResponse(bodyJson.validationToken, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      } catch {
        // Not valid JSON with validationToken, continue
      }
    }

    // Handle lifecycle notifications (subscription renewal, missed notifications, etc.)
    const payload = JSON.parse(rawBody);

    log('info', 'Teams lifecycle notification received', {
      hasValue: !!payload.value,
      count: payload.value?.length || 0,
    });

    // Process lifecycle events
    for (const notification of payload.value || []) {
      const lifecycleEvent = notification.lifecycleEvent;

      if (lifecycleEvent === 'reauthorizationRequired') {
        log('warn', 'Teams subscription requires reauthorization', {
          subscriptionId: notification.subscriptionId,
          expirationDateTime: notification.subscriptionExpirationDateTime,
        });

        // Find the connection and attempt renewal
        try {
          const [connection] = await db
            .select({ id: teamsConnections.id, userId: teamsConnections.userId })
            .from(teamsConnections)
            .where(eq(teamsConnections.graphSubscriptionId, notification.subscriptionId))
            .limit(1);

          if (connection) {
            const token = await getValidTeamsToken(connection.userId);
            if (token) {
              const result = await renewTeamsSubscription(token, notification.subscriptionId);
              if (result) {
                await db
                  .update(teamsConnections)
                  .set({
                    graphSubscriptionExpiresAt: new Date(result.expirationDateTime),
                    updatedAt: new Date(),
                  })
                  .where(eq(teamsConnections.id, connection.id));
                log('info', 'Teams subscription renewed via lifecycle webhook', {
                  subscriptionId: notification.subscriptionId,
                  newExpiration: result.expirationDateTime,
                });
              } else {
                log('error', 'Teams subscription renewal failed', {
                  subscriptionId: notification.subscriptionId,
                });
              }
            } else {
              log('error', 'No valid token for Teams subscription renewal', {
                subscriptionId: notification.subscriptionId,
                userId: connection.userId,
              });
            }
          } else {
            log('warn', 'No connection found for Teams subscription', {
              subscriptionId: notification.subscriptionId,
            });
          }
        } catch (renewError) {
          log('error', 'Teams lifecycle renewal error', {
            subscriptionId: notification.subscriptionId,
            error: renewError instanceof Error ? renewError.message : String(renewError),
          });
        }
      } else if (lifecycleEvent === 'subscriptionRemoved') {
        log('warn', 'Teams subscription was removed — attempting recreation', {
          subscriptionId: notification.subscriptionId,
        });

        // Attempt to recreate the subscription
        try {
          const [connection] = await db
            .select({
              id: teamsConnections.id,
              userId: teamsConnections.userId,
              msUserId: teamsConnections.msUserId,
            })
            .from(teamsConnections)
            .where(eq(teamsConnections.graphSubscriptionId, notification.subscriptionId))
            .limit(1);

          if (connection) {
            const token = await getValidTeamsToken(connection.userId);
            if (token) {
              const newSub = await createTeamsSubscription(token, connection.msUserId);
              if (newSub) {
                await db
                  .update(teamsConnections)
                  .set({
                    graphSubscriptionId: newSub.subscriptionId,
                    graphSubscriptionExpiresAt: new Date(newSub.expirationDateTime),
                    updatedAt: new Date(),
                  })
                  .where(eq(teamsConnections.id, connection.id));
                log('info', 'Teams subscription recreated after removal', {
                  oldSubscriptionId: notification.subscriptionId,
                  newSubscriptionId: newSub.subscriptionId,
                });
              } else {
                log('error', 'Failed to recreate Teams subscription', {
                  subscriptionId: notification.subscriptionId,
                });
              }
            } else {
              log('error', 'No valid token for subscription recreation', {
                subscriptionId: notification.subscriptionId,
                userId: connection.userId,
              });
            }
          }
        } catch (recreateError) {
          log('error', 'Teams subscription recreation error', {
            subscriptionId: notification.subscriptionId,
            error: recreateError instanceof Error ? recreateError.message : String(recreateError),
          });
        }
      } else if (lifecycleEvent === 'missed') {
        log('warn', 'Teams notifications were missed — some meeting transcripts may not have been processed', {
          subscriptionId: notification.subscriptionId,
          resourceData: notification.resourceData,
        });
      } else {
        log('info', 'Teams lifecycle event', {
          lifecycleEvent,
          subscriptionId: notification.subscriptionId,
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 202 });
  } catch (error) {
    log('error', 'Teams lifecycle processing error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ received: true }, { status: 202 });
  }
}
