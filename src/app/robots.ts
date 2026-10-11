import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        // Explicitly allow AI search crawlers for citation/visibility
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'Google-Extended',
          'ClaudeBot',
          'Claude-SearchBot',
          'PerplexityBot',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://www.aifromscratch.in/sitemap.xml',
    host: 'https://www.aifromscratch.in',
  };
}
