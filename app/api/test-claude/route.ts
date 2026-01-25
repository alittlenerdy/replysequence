import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('Testing Claude API with timeout...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say "test successful"' }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `API error ${response.status}`,
          details: errorText,
          elapsed,
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      elapsed,
      response: data.content[0]?.text,
      usage: data.usage,
    });
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    const err = error as Error;

    return NextResponse.json(
      {
        success: false,
        error: err.name === 'AbortError' ? 'Request timed out after 10s' : err.message,
        elapsed,
      },
      { status: 500 }
    );
  }
}
