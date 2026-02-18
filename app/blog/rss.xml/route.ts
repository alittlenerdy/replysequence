import { blogPosts } from '@/lib/blog-data';

export async function GET() {
  const baseUrl = 'https://www.replysequence.com';

  const items = blogPosts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date + 'T00:00:00').toUTCString()}</pubDate>
      <author>jimmy@replysequence.com (${post.author})</author>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
    </item>`
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ReplySequence Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Insights on meeting follow-up automation, sales productivity, and AI-powered email drafts.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
