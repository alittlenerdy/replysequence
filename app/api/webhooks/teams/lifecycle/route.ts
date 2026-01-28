import { NextRequest, NextResponse } from 'next/server';

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
        // TODO: Trigger subscription renewal
      } else if (lifecycleEvent === 'subscriptionRemoved') {
        log('warn', 'Teams subscription was removed', {
          subscriptionId: notification.subscriptionId,
        });
      } else if (lifecycleEvent === 'missed') {
        log('warn', 'Teams notifications were missed', {
          subscriptionId: notification.subscriptionId,
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
