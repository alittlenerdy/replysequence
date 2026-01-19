import crypto from 'crypto';

/**
 * Verify Zoom webhook signature
 * Zoom uses HMAC SHA-256 for webhook verification
 *
 * @param requestBody - Raw request body as string
 * @param signature - The x-zm-signature header value
 * @param timestamp - The x-zm-request-timestamp header value
 * @returns boolean - true if signature is valid
 */
export function verifyZoomSignature(
  requestBody: string,
  signature: string,
  timestamp: string
): boolean {
  const webhookSecretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

  if (!webhookSecretToken) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'ZOOM_WEBHOOK_SECRET_TOKEN not configured',
    }));
    return false;
  }

  // Zoom signature format: v0=<hash>
  const message = `v0:${timestamp}:${requestBody}`;
  const expectedSignature =
    'v0=' +
    crypto
      .createHmac('sha256', webhookSecretToken)
      .update(message)
      .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

/**
 * Generate challenge response for Zoom webhook URL validation
 * Zoom sends a challenge during webhook endpoint validation
 *
 * @param plainToken - The plain_token from Zoom's validation request
 * @returns Object with plainToken and encryptedToken for response
 */
export function generateChallengeResponse(plainToken: string): {
  plainToken: string;
  encryptedToken: string;
} {
  const webhookSecretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

  if (!webhookSecretToken) {
    throw new Error('ZOOM_WEBHOOK_SECRET_TOKEN not configured');
  }

  const encryptedToken = crypto
    .createHmac('sha256', webhookSecretToken)
    .update(plainToken)
    .digest('hex');

  return {
    plainToken,
    encryptedToken,
  };
}
