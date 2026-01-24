/**
 * Download transcript from Zoom API using recording password
 * @param downloadUrl - The transcript download URL from Zoom
 * @param password - Recording password from payload.object.password
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns VTT content as string
 */
export async function downloadTranscript(
  downloadUrl: string,
  password?: string,
  timeoutMs: number = 30000
): Promise<string> {
  const startTime = Date.now();

  // Build URL with password as ?pwd= query param
  const urlWithPassword = password
    ? `${downloadUrl}?pwd=${encodeURIComponent(password)}`
    : downloadUrl;

  // Log exact values for debugging
  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting transcript download from Zoom',
    download_url: downloadUrl,
    hasPassword: !!password,
    password: password || 'missing',
    urlWithPassword,
    timeoutMs,
  }));

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(JSON.stringify({
      level: 'error',
      message: 'Transcript download timed out',
      url: urlWithPassword,
      timeoutMs,
      elapsedMs: Date.now() - startTime,
    }));
  }, timeoutMs);

  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Fetching transcript',
      url: urlWithPassword,
    }));

    const response = await fetch(urlWithPassword, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript download response received',
      status: response.status,
      statusText: response.statusText,
      elapsedMs: Date.now() - startTime,
    }));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error body');
      console.log(JSON.stringify({
        level: 'error',
        message: 'Failed to download transcript - non-OK response',
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500),
        url: downloadUrl.substring(0, 80) + '...',
        elapsedMs: Date.now() - startTime,
      }));

      throw new Error(
        `Failed to download transcript: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`
      );
    }

    const content = await response.text();

    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript downloaded successfully',
      contentLength: content.length,
      elapsedMs: Date.now() - startTime,
    }));

    return content;
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Transcript download failed with exception',
      errorName,
      errorMessage,
      isAbortError: errorName === 'AbortError',
      url: downloadUrl.substring(0, 80) + '...',
      elapsedMs: Date.now() - startTime,
    }));

    if (errorName === 'AbortError') {
      throw new Error(`Transcript download timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}

/**
 * Download recording file from Zoom using download token
 * @param downloadUrl - The recording download URL from Zoom
 * @param downloadToken - Download token from webhook payload (no OAuth needed)
 * @param timeoutMs - Timeout in milliseconds (default 60s for larger files)
 * @returns Recording content as ArrayBuffer
 */
export async function downloadRecording(
  downloadUrl: string,
  downloadToken: string,
  timeoutMs: number = 60000
): Promise<ArrayBuffer> {
  const startTime = Date.now();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting recording download from Zoom',
    download_url: downloadUrl,
    tokenLength: downloadToken.length,
    timeoutMs,
  }));

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(JSON.stringify({
      level: 'error',
      message: 'Recording download timed out',
      url: downloadUrl,
      timeoutMs,
      elapsedMs: Date.now() - startTime,
    }));
  }, timeoutMs);

  try {
    // Use Authorization: Bearer header (not query param)
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${downloadToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error body');
      console.log(JSON.stringify({
        level: 'error',
        message: 'Failed to download recording - non-OK response',
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500),
        elapsedMs: Date.now() - startTime,
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
      elapsedMs: Date.now() - startTime,
    }));

    return buffer;
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Recording download failed with exception',
      errorName,
      errorMessage,
      isAbortError: errorName === 'AbortError',
      elapsedMs: Date.now() - startTime,
    }));

    if (errorName === 'AbortError') {
      throw new Error(`Recording download timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}
