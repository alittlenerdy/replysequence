import { ImageResponse } from 'next/og';
import { getBlogPost } from '@/lib/blog-data';

export const runtime = 'edge';
export const alt = 'ReplySequence Blog';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Color palette for tag-based accent colors
const TAG_COLORS: Record<string, string> = {
  'sales productivity': '#3B82F6',
  'email automation': '#8B5CF6',
  'meeting follow-up': '#10B981',
  'ai email': '#EC4899',
  'crm integration': '#F59E0B',
  'zoom meetings': '#2563EB',
  'team management': '#6366F1',
  'sales engagement': '#14B8A6',
  'consulting': '#F97316',
  'recruiting': '#06B6D4',
};

function getAccentColor(tags: string[]): string {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    for (const [key, color] of Object.entries(TAG_COLORS)) {
      if (lower.includes(key) || key.includes(lower)) return color;
    }
  }
  return '#8B5CF6'; // default purple
}

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            fontSize: 48,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ReplySequence Blog
        </div>
      ),
      { ...size }
    );
  }

  const accent = getAccentColor(post.tags);
  const formattedDate = new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          background: 'linear-gradient(135deg, #0C0C18 0%, #111827 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${accent}, #8B5CF6)`,
          }}
        />

        {/* Top: Tags + Reading time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {post.tags.slice(0, 3).map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '8px 20px',
                background: `${accent}22`,
                borderRadius: 24,
                border: `1px solid ${accent}44`,
                fontSize: 18,
                color: accent,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 18,
              color: '#64748b',
            }}
          >
            {post.readingTime} min read
          </div>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            paddingTop: 20,
            paddingBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: post.title.length > 60 ? 44 : 52,
              fontWeight: 800,
              color: '#f8fafc',
              lineHeight: 1.2,
              letterSpacing: -1,
              maxWidth: 1000,
            }}
          >
            {post.title}
          </div>
        </div>

        {/* Bottom: Author + Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Author + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Author avatar placeholder */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: `linear-gradient(135deg, ${accent}, #8B5CF6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {post.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: '#e2e8f0' }}>
                {post.author}
              </span>
              <span style={{ fontSize: 18, color: '#64748b' }}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="26"
                height="26"
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
                fontSize: 28,
                fontWeight: 700,
                background: 'linear-gradient(90deg, #ffffff 0%, #a78bfa 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ReplySequence
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
