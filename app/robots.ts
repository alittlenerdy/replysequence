import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/onboarding/', '/sign-in/', '/sign-up/'],
      },
    ],
    sitemap: 'https://www.replysequence.com/sitemap.xml',
  };
}
