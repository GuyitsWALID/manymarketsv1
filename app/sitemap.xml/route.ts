import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manymarkets.com';

  const routes = [
    { path: '', changefreq: 'weekly', priority: '0.9' },
    { path: 'blog', changefreq: 'daily', priority: '0.8' },
    { path: 'daily-ideas', changefreq: 'daily', priority: '0.8' },
    { path: 'builder', changefreq: 'weekly', priority: '0.7' },
    { path: 'chat', changefreq: 'weekly', priority: '0.7' },
    { path: 'idea-score', changefreq: 'weekly', priority: '0.7' },
    { path: 'login', changefreq: 'monthly', priority: '0.5' },
    { path: 'upgrade', changefreq: 'monthly', priority: '0.6' },
    { path: 'privacy', changefreq: 'monthly', priority: '0.3' },
    { path: 'terms', changefreq: 'monthly', priority: '0.3' },
    { path: 'refund-policy', changefreq: 'monthly', priority: '0.3' },
  ];

  const urls = routes.map((r) => `  <url>\n    <loc>${baseUrl}/${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
