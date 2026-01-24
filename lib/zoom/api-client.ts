/**
 * Zoom API client for fetching recording details
 * Uses Server-to-Server OAuth for authentication
 */

interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  play_url?: string;
  download_url: string;
  status: string;
  recording_type?: string;
}

interface ZoomRecordingsResponse {
  uuid: string;
  id: number;
  account_id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  timezone: string;
  duration: number;
  total_size: number;
  recording_count: number;
  share_url?: string;
  recording_files: ZoomRecordingFile[];
  // This is the key field - download token for authenticated downloads
  download_access_token?: string;
  password?: string;
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

  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching Zoom OAuth token',
    accountId: accountId.substring(0, 8) + '...',
  }));

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

/**
 * Fetch recording details from Zoom API
 * Returns recording files and download_access_token
 *
 * @param meetingId - The Zoom meeting UUID (double-encoded if contains / or //)
 * @returns Recording details including download_access_token
 */
export async function getRecordingDetails(meetingId: string): Promise<{
  transcriptUrl: string | null;
  downloadToken: string;
}> {
  const accessToken = await getZoomAccessToken();

  // Double-encode meetingId if it contains / or // (Zoom API requirement)
  const encodedMeetingId = meetingId.startsWith('/') || meetingId.includes('//')
    ? encodeURIComponent(encodeURIComponent(meetingId))
    : encodeURIComponent(meetingId);

  const apiUrl = `https://api.zoom.us/v2/meetings/${encodedMeetingId}/recordings`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching recording details from Zoom API',
    meetingId,
  }));

  const response = await fetch(apiUrl, {
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
      message: 'Failed to fetch recording details',
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      meetingId,
    }));

    throw new Error(`Failed to fetch recording details: ${response.status} - ${errorText}`);
  }

  const data: ZoomRecordingsResponse = await response.json();

  // Find transcript file
  const transcriptFile = data.recording_files?.find(
    (f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed'
  );

  if (!data.download_access_token) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'No download_access_token in recordings response',
      meetingId,
      hasRecordingFiles: !!data.recording_files?.length,
    }));
    throw new Error('No download_access_token in Zoom API response');
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Recording details fetched successfully',
    meetingId,
    hasTranscript: !!transcriptFile,
    fileCount: data.recording_files?.length || 0,
  }));

  return {
    transcriptUrl: transcriptFile?.download_url || null,
    downloadToken: data.download_access_token,
  };
}
