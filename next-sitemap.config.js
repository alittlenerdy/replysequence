/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.replysequence.com',
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
    '/icon.svg', // Exclude SVG icon from sitemap
  ],
  changefreq: 'weekly',
  priority: 0.7,
  // Add dynamic pages that should be indexed
  additionalPaths: async (config) => [
    await config.transform(config, '/pricing'),
    await config.transform(config, '/compare/otter'),
    await config.transform(config, '/compare/fireflies'),
    await config.transform(config, '/compare/grain'),
    await config.transform(config, '/compare/fathom'),
    await config.transform(config, '/compare/tldv'),
  ],
  transform: async (config, path) => {
    // Custom priority for specific pages
    const priorityMap = {
      '/': 1.0,
      '/pricing': 0.9,
      '/how-it-works': 0.9,
      '/compare/otter': 0.85,
      '/compare/fireflies': 0.85,
      '/compare/grain': 0.85,
      '/compare/fathom': 0.85,
      '/compare/tldv': 0.85,
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
