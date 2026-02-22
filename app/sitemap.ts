import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.replysequence.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date('2026-02-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date('2026-02-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/integrations`,
      lastModified: new Date('2026-02-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-02-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-02-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-01-27'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-01-27'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: new Date('2026-01-27'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Comparison pages
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/gong`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/otter`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/fireflies`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/chorus`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/fathom`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/avoma`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/grain`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/tldv`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Blog
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-02-22'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date + 'T00:00:00'),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
