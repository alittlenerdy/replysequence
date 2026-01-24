/**
 * Download transcript from Zoom API using download token
 * @param downloadUrl - The transcript download URL from Zoom
 * @param downloadToken - Download token from webhook payload (no OAuth needed)
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns VTT content as string
 */
export async function downloadTranscript(
  downloadUrl: string,
  downloadToken: string,
  timeoutMs: number = 30000
): Promise<string> {
  const startTime = Date.now();

  // Append access_token as query parameter (Zoom's recommended approach for download tokens)
  const urlWithToken = `${downloadUrl}?access_token=${downloadToken}`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting transcript download from Zoom',
    url: downloadUrl.substring(0, 80) + '...',
    tokenLength: downloadToken.length,
    timeoutMs,
  }));

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(JSON.stringify({
      level: 'error',
      message: 'Transcript download timed out',
      url: downloadUrl.substring(0, 80) + '...',
      timeoutMs,
      elapsedMs: Date.now() - startTime,
    }));
  }, timeoutMs);

  try {
    const response = await fetch(urlWithToken, {
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

  // Append access_token as query parameter (Zoom's recommended approach for download tokens)
  const urlWithToken = `${downloadUrl}?access_token=${downloadToken}`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting recording download from Zoom',
    url: downloadUrl.substring(0, 80) + '...',
    timeoutMs,
  }));

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(JSON.stringify({
      level: 'error',
      message: 'Recording download timed out',
      url: downloadUrl.substring(0, 80) + '...',
      timeoutMs,
      elapsedMs: Date.now() - startTime,
    }));
  }, timeoutMs);

  try {
    const response = await fetch(urlWithToken, {
      method: 'GET',
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
