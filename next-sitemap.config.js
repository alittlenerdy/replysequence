/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://replysequence.vercel.app',
  generateRobotsTxt: false, // We have our own robots.txt
  generateIndexSitemap: false,
  outDir: 'public',
  exclude: [
    '/dashboard',
    '/dashboard/*',
    '/api/*',
    '/sign-in',
    '/sign-in/*',
    '/sign-up',
    '/sign-up/*',
    '/onboarding',
    '/sentry-example-page',
    '/icon.svg', // Exclude SVG icon from sitemap
  ],
  changefreq: 'weekly',
  priority: 0.7,
  // Add pricing page which is dynamic but should be indexed
  additionalPaths: async (config) => [
    await config.transform(config, '/pricing'),
  ],
  transform: async (config, path) => {
    // Custom priority for specific pages
    const priorityMap = {
      '/': 1.0,
      '/pricing': 0.9,
      '/how-it-works': 0.9,
      '/security': 0.7,
      '/privacy': 0.5,
      '/terms': 0.5,
    };

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priorityMap[path] || config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
