/**
 * Download transcript from Zoom API using download token
 * @param downloadUrl - The transcript download URL from Zoom
 * @param downloadToken - Download token from webhook payload (no OAuth needed)
 * @returns VTT content as string
 */
export async function downloadTranscript(
  downloadUrl: string,
  downloadToken: string
): Promise<string> {
  // Append access_token as query parameter (Zoom's recommended approach for download tokens)
  const urlWithToken = `${downloadUrl}?access_token=${downloadToken}`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading transcript from Zoom',
    url: downloadUrl.substring(0, 50) + '...', // Truncate for logging
  }));

  const response = await fetch(urlWithToken, {
    method: 'GET',
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
 * Download recording file from Zoom using download token
 * @param downloadUrl - The recording download URL from Zoom
 * @param downloadToken - Download token from webhook payload (no OAuth needed)
 * @returns Recording content as ArrayBuffer
 */
export async function downloadRecording(
  downloadUrl: string,
  downloadToken: string
): Promise<ArrayBuffer> {
  // Append access_token as query parameter (Zoom's recommended approach for download tokens)
  const urlWithToken = `${downloadUrl}?access_token=${downloadToken}`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading recording from Zoom',
    url: downloadUrl.substring(0, 50) + '...', // Truncate for logging
  }));

  const response = await fetch(urlWithToken, {
    method: 'GET',
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
