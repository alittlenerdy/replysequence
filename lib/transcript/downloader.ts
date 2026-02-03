/**
 * Download transcript from Zoom using download_access_token
 * @param downloadUrl - The transcript download URL from Zoom
 * @param accessToken - download_access_token from Zoom API (download_token from webhook)
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns VTT content as string
 */
export async function downloadTranscript(
  downloadUrl: string,
  accessToken: string,
  timeoutMs: number = 30000
): Promise<string> {
  const startTime = Date.now();

  // Handle test URLs - return mock transcript content for testing
  if (downloadUrl.includes('/test-transcript-')) {
    console.log(JSON.stringify({
      level: 'info',
      message: '[TRANSCRIPT-4] Test URL detected, returning mock content',
      url: downloadUrl,
    }));
    return getMockTranscriptContent();
  }

  // Build URL with access_token query param
  // Per Zoom docs: download_token should be passed as ?access_token= query param
  const urlWithToken = `${downloadUrl}?access_token=${accessToken}`;

  // [TRANSCRIPT-4] Starting download
  console.log(JSON.stringify({
    level: 'info',
    message: '[TRANSCRIPT-4] Starting download',
    url: downloadUrl.substring(0, 80) + '...',
    hasToken: !!accessToken,
    tokenLength: accessToken?.length || 0,
    timeoutMs,
  }));

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(JSON.stringify({
      level: 'error',
      message: 'Transcript download timed out',
      url: downloadUrl,
      timeoutMs,
      elapsedMs: Date.now() - startTime,
    }));
  }, timeoutMs);

  try {
    const response = await fetch(urlWithToken, {
      method: 'GET',
      headers: {
        'Accept': 'text/vtt, text/plain, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error body');
      console.log(JSON.stringify({
        level: 'error',
        message: '[TRANSCRIPT-4] Download failed - non-OK response',
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
    const contentLength = content.length;
    const startsWithWebVTT = content.trim().startsWith('WEBVTT');
    const firstLine = content.split('\n')[0];

    // [TRANSCRIPT-4] Download complete
    console.log(JSON.stringify({
      level: 'info',
      message: '[TRANSCRIPT-4] Download complete',
      status: response.status,
      contentLength,
      firstLine,
      startsWithWebVTT,
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

/**
 * Returns mock VTT transcript content for testing
 */
function getMockTranscriptContent(): string {
  return `WEBVTT

1
00:00:00.000 --> 00:00:03.500
Speaker 1: Hi everyone, thanks for joining this sales call today.

2
00:00:03.500 --> 00:00:08.000
Speaker 1: I'm excited to show you how ReplySequence can transform your follow-up workflow.

3
00:00:08.000 --> 00:00:12.500
Speaker 2: Thanks for having me. I've been looking for a solution to automate our meeting follow-ups.

4
00:00:12.500 --> 00:00:18.000
Speaker 1: Perfect. Let me walk you through the key features. First, we automatically capture transcripts from Zoom.

5
00:00:18.000 --> 00:00:23.500
Speaker 1: Then our AI generates personalized follow-up emails within minutes of your meeting ending.

6
00:00:23.500 --> 00:00:28.000
Speaker 2: That sounds great. What about action items? Can it extract those too?

7
00:00:28.000 --> 00:00:33.500
Speaker 1: Absolutely. We identify action items, assign owners, and include them in the follow-up email.

8
00:00:33.500 --> 00:00:38.000
Speaker 2: Impressive. I'd like to schedule a demo with my team next week. Can we do Tuesday at 2pm?

9
00:00:38.000 --> 00:00:42.500
Speaker 1: Tuesday at 2pm works perfectly. I'll send over a calendar invite right after this call.

10
00:00:42.500 --> 00:00:47.000
Speaker 2: Great. Also, can you send me pricing information for the enterprise plan?

11
00:00:47.000 --> 00:00:52.000
Speaker 1: Of course. I'll include that in my follow-up email along with a case study from a similar company.

12
00:00:52.000 --> 00:00:55.000
Speaker 2: Perfect. Thanks for your time today. Looking forward to the demo.

13
00:00:55.000 --> 00:00:58.000
Speaker 1: Thank you! Talk to you on Tuesday. Have a great day.`;
}
