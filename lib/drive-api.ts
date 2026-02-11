/**
 * Google Drive API utilities for finding meeting notes
 *
 * Used as a fallback when Meet API doesn't return transcripts or smart notes
 * (e.g., when Gemini notes are created outside of Meet's artifact system)
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

/**
 * Logger helper
 */
function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'drive-api',
      ...data,
    })
  );
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface DriveSearchResult {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * Search Google Drive for meeting notes
 * Looks for Google Docs created/modified around the meeting time
 *
 * @param accessToken - OAuth access token
 * @param meetingTopic - Meeting topic/title to search for
 * @param meetingTime - Approximate meeting time
 * @param windowMinutes - Time window to search (default 60 minutes)
 */
export async function searchMeetingNotes(
  accessToken: string,
  meetingTopic: string,
  meetingTime: Date,
  windowMinutes: number = 60
): Promise<DriveFile[]> {
  const windowStart = new Date(meetingTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(meetingTime.getTime() + windowMinutes * 60 * 1000);

  log('info', 'Searching Drive for meeting notes', {
    meetingTopic,
    meetingTime: meetingTime.toISOString(),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  });

  // Build search query
  // Look for Google Docs that:
  // 1. Were modified in the time window
  // 2. Have meeting-related keywords in the name
  // 3. Are Google Docs (not sheets, slides, etc.)
  const queries = [
    `mimeType='application/vnd.google-apps.document'`,
    `modifiedTime >= '${windowStart.toISOString()}'`,
    `modifiedTime <= '${windowEnd.toISOString()}'`,
  ];

  // Add name-based searches for common meeting note patterns
  const namePatterns = [
    'Meeting notes',
    'Notes',
    'Transcript',
    meetingTopic.split(' ').slice(0, 3).join(' '), // First 3 words of topic
  ];

  const allFiles: DriveFile[] = [];

  // Search for each pattern
  for (const pattern of namePatterns) {
    try {
      const query = [...queries, `name contains '${pattern.replace(/'/g, "\\'")}'`].join(' and ');

      const params = new URLSearchParams({
        q: query,
        fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: '10',
      });

      const response = await fetch(`${DRIVE_API}/files?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        log('warn', 'Drive search failed for pattern', {
          pattern,
          status: response.status,
          error,
        });
        continue;
      }

      const data: DriveSearchResult = await response.json();

      if (data.files && data.files.length > 0) {
        log('info', 'Found Drive files matching pattern', {
          pattern,
          count: data.files.length,
          files: data.files.map(f => ({ id: f.id, name: f.name })),
        });

        // Add files that aren't already in the list
        for (const file of data.files) {
          if (!allFiles.some(f => f.id === file.id)) {
            allFiles.push(file);
          }
        }
      }
    } catch (error) {
      log('error', 'Error searching Drive', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  log('info', 'Drive search complete', {
    totalFilesFound: allFiles.length,
  });

  return allFiles;
}

/**
 * Search for files in the "Meet Recordings" folder
 * Google Meet typically saves recordings and notes here
 */
export async function searchMeetRecordingsFolder(
  accessToken: string,
  meetingTime: Date,
  windowMinutes: number = 120
): Promise<DriveFile[]> {
  const windowStart = new Date(meetingTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(meetingTime.getTime() + windowMinutes * 60 * 1000);

  log('info', 'Searching Meet Recordings folder', {
    meetingTime: meetingTime.toISOString(),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  });

  try {
    // First, find the "Meet Recordings" folder
    const folderQuery = `name='Meet Recordings' and mimeType='application/vnd.google-apps.folder'`;
    const folderParams = new URLSearchParams({
      q: folderQuery,
      fields: 'files(id,name)',
      pageSize: '1',
    });

    const folderResponse = await fetch(`${DRIVE_API}/files?${folderParams}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!folderResponse.ok) {
      log('warn', 'Could not find Meet Recordings folder');
      return [];
    }

    const folderData = await folderResponse.json();
    const meetFolder = folderData.files?.[0];

    if (!meetFolder) {
      log('info', 'No Meet Recordings folder found');
      return [];
    }

    log('info', 'Found Meet Recordings folder', { folderId: meetFolder.id });

    // Search for files in that folder modified in the time window
    const query = [
      `'${meetFolder.id}' in parents`,
      `modifiedTime >= '${windowStart.toISOString()}'`,
      `modifiedTime <= '${windowEnd.toISOString()}'`,
    ].join(' and ');

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: '20',
    });

    const response = await fetch(`${DRIVE_API}/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      log('warn', 'Could not search Meet Recordings folder', { error });
      return [];
    }

    const data: DriveSearchResult = await response.json();

    log('info', 'Found files in Meet Recordings folder', {
      count: data.files?.length || 0,
      files: data.files?.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
    });

    return data.files || [];
  } catch (error) {
    log('error', 'Error searching Meet Recordings folder', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Download a Google Doc as plain text
 */
export async function downloadDocAsText(
  accessToken: string,
  documentId: string
): Promise<string> {
  log('info', 'Downloading Google Doc as text', { documentId });

  const exportUrl = `${DRIVE_API}/files/${documentId}/export?mimeType=text/plain`;

  const response = await fetch(exportUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    log('error', 'Failed to download Doc', { documentId, status: response.status, error });
    throw new Error(`Failed to download Doc: ${response.status}`);
  }

  const content = await response.text();

  log('info', 'Downloaded Doc', {
    documentId,
    contentLength: content.length,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  });

  return content;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFile | null> {
  try {
    const params = new URLSearchParams({
      fields: 'id,name,mimeType,createdTime,modifiedTime,webViewLink',
    });

    const response = await fetch(`${DRIVE_API}/files/${fileId}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
