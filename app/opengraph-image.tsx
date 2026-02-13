import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ReplySequence - AI Follow-Up Emails from Meetings';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #ffffff 0%, #a78bfa 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ReplySequence
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 36,
            color: '#e2e8f0',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          <span>Turn Zoom, Teams & Meet calls into</span>
          <span>perfect follow-up emails in 8 seconds</span>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 32,
          }}
        >
          {['AI-Powered Drafts', 'CRM Integration', 'Save 10+ hrs/week'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: 30,
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <span style={{ color: '#a78bfa', fontSize: 20 }}>{feature}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#64748b',
          }}
        >
          replysequence.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
