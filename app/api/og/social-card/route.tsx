import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

const CARD_SIZE = { width: 1080, height: 1080 };

// Brand gradient matching NonNegotiablesCards + existing OG images
const BRAND_GRADIENT = 'linear-gradient(135deg, #4338CA 0%, #5B6CFF 50%, #7A5CFF 100%)';

// Chat bubble icon SVG path (same as opengraph-image.tsx)
const LOGO_ICON_PATH =
  'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const number = searchParams.get('number');
  const type = searchParams.get('type') || 'feature';

  if (!title) {
    return new Response('Missing required "title" parameter', { status: 400 });
  }

  // Adaptive font size: shrink for long titles
  const titleFontSize = title.length > 80 ? 48 : title.length > 50 ? 56 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: BRAND_GRADIENT,
          fontFamily: 'system-ui, sans-serif',
          padding: '64px',
        }}
      >
        {/* Top: Logo + brand name + optional badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={LOGO_ICON_PATH} />
              </svg>
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: -0.5,
              }}
            >
              ReplySequence
            </span>
          </div>

          {number && (
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Non-Negotiable #{number}
            </span>
          )}
        </div>

        {/* Center: Title + description */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            flex: 1,
            paddingTop: 40,
            paddingBottom: 40,
            maxWidth: 900,
          }}
        >
          {/* Stat type gets a decorative line above */}
          {type === 'stat' && (
            <div
              style={{
                width: 80,
                height: 4,
                background: 'rgba(255,255,255,0.4)',
                borderRadius: 2,
                marginBottom: 40,
              }}
            />
          )}

          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>

          {description && (
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.5,
                marginTop: 28,
                maxWidth: 800,
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Bottom: URL + CTA styling for cta type */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {type === 'cta' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 40px',
                borderRadius: 999,
                background: 'rgba(255,255,255,1)',
                color: '#4338CA',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              replysequence.com
            </div>
          ) : (
            <span
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 500,
              }}
            >
              replysequence.com
            </span>
          )}
        </div>
      </div>
    ),
    { ...CARD_SIZE }
  );
}
