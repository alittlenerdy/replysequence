/**
 * Zoom API client for fetching recordings with download tokens
 */

/**
 * Get Zoom OAuth access token using Server-to-Server OAuth
 */
export async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom OAuth credentials in environment variables');
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching Zoom OAuth token',
    accountId: accountId.substring(0, 8) + '...',
  }));

  const tokenUrl = 'https://zoom.us/oauth/token';
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // grant_type and account_id in request body
  const body = new URLSearchParams({
    grant_type: 'account_credentials',
    account_id: accountId,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to get Zoom access token',
      status: response.status,
      error: errorText,
    }));
    throw new Error(`Failed to get Zoom access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Zoom OAuth token acquired',
    expiresIn: data.expires_in,
  }));

  return data.access_token;
}

interface ZoomRecordingFile {
  id: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  download_url: string;
  status: string;
}

interface ZoomRecordingsResponse {
  recording_files: ZoomRecordingFile[];
  download_access_token: string;
}

/**
 * Fetch recording details from Zoom API including download_access_token
 *
 * @param meetingUuid - The meeting UUID from webhook payload
 * @returns Object with transcript URL and download access token
 */
export async function getRecordingWithToken(meetingUuid: string): Promise<{
  transcriptUrl: string | null;
  downloadAccessToken: string;
}> {
  const accessToken = await getZoomAccessToken();

  // Double-encode UUID if it contains / or // (Zoom API requirement)
  const encodedUuid = meetingUuid.includes('/')
    ? encodeURIComponent(encodeURIComponent(meetingUuid))
    : encodeURIComponent(meetingUuid);

  const apiUrl = `https://api.zoom.us/v2/meetings/${encodedUuid}/recordings?include_fields=download_access_token`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching recordings from Zoom API',
    meetingUuid,
    apiUrl,
  }));

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to fetch recordings from Zoom API',
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      meetingUuid,
    }));
    throw new Error(`Failed to fetch recordings: ${response.status} - ${errorText}`);
  }

  const data: ZoomRecordingsResponse = await response.json();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Recordings fetched from Zoom API',
    meetingUuid,
    fileCount: data.recording_files?.length || 0,
    hasDownloadAccessToken: !!data.download_access_token,
    fileTypes: data.recording_files?.map(f => f.file_type) || [],
  }));

  if (!data.download_access_token) {
    throw new Error('No download_access_token in Zoom API response');
  }

  // Find transcript file
  const transcriptFile = data.recording_files?.find(
    f => f.file_type === 'TRANSCRIPT' && f.status === 'completed'
  );

  return {
    transcriptUrl: transcriptFile?.download_url || null,
    downloadAccessToken: data.download_access_token,
  };
}
