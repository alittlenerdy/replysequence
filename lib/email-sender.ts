import { decrypt, encrypt } from '@/lib/encryption';
import { db, emailConnections } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface ConnectedEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'gmail' | 'outlook';
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

export async function refreshGmailToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(JSON.stringify({
      level: 'error',
      tag: '[EMAIL-SENDER]',
      message: 'Gmail token refresh failed',
      status: response.status,
      error: errorText,
      timestamp: new Date().toISOString(),
    }));
    throw new Error(`Gmail token refresh failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  console.log(JSON.stringify({
    level: 'info',
    tag: '[EMAIL-SENDER]',
    message: 'Gmail token refreshed successfully',
    expiresIn: data.expires_in,
    timestamp: new Date().toISOString(),
  }));

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshOutlookToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_TEAMS_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_TEAMS_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'openid profile email Mail.Send offline_access',
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.log(JSON.stringify({
      level: 'error',
      tag: '[EMAIL-SENDER]',
      message: 'Outlook token refresh failed',
      status: response.status,
      error: errorText,
      timestamp: new Date().toISOString(),
    }));
    throw new Error(`Outlook token refresh failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  console.log(JSON.stringify({
    level: 'info',
    tag: '[EMAIL-SENDER]',
    message: 'Outlook token refreshed successfully',
    expiresIn: data.expires_in,
    timestamp: new Date().toISOString(),
  }));

  // NOTE: Microsoft returns a NEW refresh token on each refresh, which must be stored
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// ---------------------------------------------------------------------------
// Send via Gmail
// ---------------------------------------------------------------------------

export async function sendViaGmail(params: {
  accessToken: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  replyTo?: string;
}): Promise<ConnectedEmailResult> {
  const { accessToken, from, to, subject, htmlBody, textBody, replyTo } = params;

  try {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
    ];

    if (replyTo) {
      headers.push(`Reply-To: ${replyTo}`);
    }

    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const message = [
      headers.join('\r\n'),
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      textBody,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      htmlBody,
      `--${boundary}--`,
    ].join('\r\n');

    const base64urlMessage = Buffer.from(message).toString('base64url');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64urlMessage }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        tag: '[EMAIL-SENDER]',
        message: 'Gmail send failed',
        status: response.status,
        error: errorText,
        to,
        timestamp: new Date().toISOString(),
      }));
      return {
        success: false,
        error: `Gmail send failed: ${response.status} ${errorText}`,
        provider: 'gmail',
      };
    }

    const data = await response.json();

    console.log(JSON.stringify({
      level: 'info',
      tag: '[EMAIL-SENDER]',
      message: 'Email sent via Gmail',
      messageId: data.id,
      to,
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      messageId: data.id,
      provider: 'gmail',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      level: 'error',
      tag: '[EMAIL-SENDER]',
      message: 'Gmail send threw exception',
      error: errorMessage,
      to,
      timestamp: new Date().toISOString(),
    }));
    return {
      success: false,
      error: errorMessage,
      provider: 'gmail',
    };
  }
}

// ---------------------------------------------------------------------------
// Send via Outlook
// ---------------------------------------------------------------------------

export async function sendViaOutlook(params: {
  accessToken: string;
  to: string;
  subject: string;
  htmlBody: string;
  replyTo?: string;
}): Promise<ConnectedEmailResult> {
  const { accessToken, to, subject, htmlBody, replyTo } = params;

  try {
    const mailBody: Record<string, unknown> = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: htmlBody,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        ...(replyTo
          ? {
              replyTo: [
                {
                  emailAddress: {
                    address: replyTo,
                  },
                },
              ],
            }
          : {}),
      },
    };

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailBody),
      }
    );

    // Microsoft Graph returns 202 Accepted for sendMail on success (no body)
    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        tag: '[EMAIL-SENDER]',
        message: 'Outlook send failed',
        status: response.status,
        error: errorText,
        to,
        timestamp: new Date().toISOString(),
      }));
      return {
        success: false,
        error: `Outlook send failed: ${response.status} ${errorText}`,
        provider: 'outlook',
      };
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[EMAIL-SENDER]',
      message: 'Email sent via Outlook',
      to,
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      provider: 'outlook',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      level: 'error',
      tag: '[EMAIL-SENDER]',
      message: 'Outlook send threw exception',
      error: errorMessage,
      to,
      timestamp: new Date().toISOString(),
    }));
    return {
      success: false,
      error: errorMessage,
      provider: 'outlook',
    };
  }
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

export async function sendViaConnectedAccount(params: {
  connection: {
    provider: 'gmail' | 'outlook';
    email: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string;
    accessTokenExpiresAt: Date;
    id: string;
  };
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  replyTo?: string;
}): Promise<ConnectedEmailResult> {
  const { connection, to, subject, htmlBody, textBody, replyTo } = params;

  console.log(JSON.stringify({
    level: 'info',
    tag: '[EMAIL-SENDER]',
    message: 'Sending email via connected account',
    provider: connection.provider,
    from: connection.email,
    to,
    connectionId: connection.id,
    timestamp: new Date().toISOString(),
  }));

  try {
    // 1. Decrypt the access token
    let accessToken = decrypt(connection.accessTokenEncrypted);

    // 2. Check if expired
    if (connection.accessTokenExpiresAt < new Date()) {
      console.log(JSON.stringify({
        level: 'info',
        tag: '[EMAIL-SENDER]',
        message: 'Access token expired, refreshing',
        provider: connection.provider,
        connectionId: connection.id,
        expiredAt: connection.accessTokenExpiresAt.toISOString(),
        timestamp: new Date().toISOString(),
      }));

      // 3. Decrypt refresh token and refresh
      const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);

      if (connection.provider === 'gmail') {
        const refreshed = await refreshGmailToken(refreshTokenDecrypted);
        accessToken = refreshed.accessToken;

        // Update DB with new encrypted access token + expiration
        const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
        await db
          .update(emailConnections)
          .set({
            accessTokenEncrypted: encrypt(refreshed.accessToken),
            accessTokenExpiresAt: newExpiresAt,
          })
          .where(eq(emailConnections.id, connection.id));

        console.log(JSON.stringify({
          level: 'info',
          tag: '[EMAIL-SENDER]',
          message: 'Gmail token refreshed and stored',
          connectionId: connection.id,
          newExpiresAt: newExpiresAt.toISOString(),
          timestamp: new Date().toISOString(),
        }));
      } else {
        // Outlook
        const refreshed = await refreshOutlookToken(refreshTokenDecrypted);
        accessToken = refreshed.accessToken;

        // Update DB with new encrypted access AND refresh tokens + expiration
        const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
        await db
          .update(emailConnections)
          .set({
            accessTokenEncrypted: encrypt(refreshed.accessToken),
            refreshTokenEncrypted: encrypt(refreshed.refreshToken),
            accessTokenExpiresAt: newExpiresAt,
          })
          .where(eq(emailConnections.id, connection.id));

        console.log(JSON.stringify({
          level: 'info',
          tag: '[EMAIL-SENDER]',
          message: 'Outlook tokens refreshed and stored',
          connectionId: connection.id,
          newExpiresAt: newExpiresAt.toISOString(),
          timestamp: new Date().toISOString(),
        }));
      }
    }

    // 4. Send via the correct provider
    if (connection.provider === 'gmail') {
      return await sendViaGmail({
        accessToken,
        from: connection.email,
        to,
        subject,
        htmlBody,
        textBody,
        replyTo,
      });
    } else {
      return await sendViaOutlook({
        accessToken,
        to,
        subject,
        htmlBody,
        replyTo,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      level: 'error',
      tag: '[EMAIL-SENDER]',
      message: 'sendViaConnectedAccount failed',
      provider: connection.provider,
      connectionId: connection.id,
      to,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }));
    return {
      success: false,
      error: errorMessage,
      provider: connection.provider,
    };
  }
}
