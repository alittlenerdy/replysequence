/**
 * Download transcript from Zoom API
 * @param downloadUrl - The transcript download URL from Zoom
 * @param accessToken - OAuth access token for Zoom API
 * @returns VTT content as string
 */
export async function downloadTranscript(
  downloadUrl: string,
  accessToken: string
): Promise<string> {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading transcript from Zoom',
    url: downloadUrl.substring(0, 50) + '...', // Truncate for logging
  }));

  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to download transcript',
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    }));

    throw new Error(
      `Failed to download transcript: ${response.status} ${response.statusText}`
    );
  }

  const content = await response.text();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Transcript downloaded successfully',
    contentLength: content.length,
  }));

  return content;
}

/**
 * Get Zoom OAuth access token using Server-to-Server OAuth
 * @returns Access token string
 */
export async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom OAuth credentials in environment variables');
  }

  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to get Zoom access token',
      status: response.status,
      error: errorText,
    }));

    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Download recording file from Zoom
 * @param downloadUrl - The recording download URL from Zoom
 * @param accessToken - OAuth access token for Zoom API
 * @returns Recording content as ArrayBuffer
 */
export async function downloadRecording(
  downloadUrl: string,
  accessToken: string
): Promise<ArrayBuffer> {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading recording from Zoom',
    url: downloadUrl.substring(0, 50) + '...', // Truncate for logging
  }));

  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to download recording',
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    }));

    throw new Error(
      `Failed to download recording: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Recording downloaded successfully',
    contentLength: buffer.byteLength,
  }));

  return buffer;
}
