# SEO Checklist for ManyMarkets

This file lists SEO improvements implemented and next steps to improve discoverability after launch.

Implemented
- Added rich `metadata` in `app/layout.tsx` (title, description, keywords, Open Graph, Twitter, robots).
- Added canonical link and `theme-color` meta tag.
- Injected JSON-LD WebSite structured data for `SearchAction`.
- Added dynamic `sitemap.xml` route at `/sitemap.xml`.
- Added `public/robots.txt` referencing the sitemap.

Next steps / Recommendations
- Set `NEXT_PUBLIC_APP_URL` to production URL in environment at deploy time.
- Provide an `og-image.png` (1200x630) in `/public` for social previews.
- Add a dynamic `hreflang`/multilingual sitemap if supporting multiple locales.
- Validate structured data with Google Rich Results Test.
- Submit sitemap to Google Search Console and Bing Webmaster Tools.
- Add server-side rendered content for important pages to ensure crawlers index full content.
- Add meta tags on key pages (product pages) with specific descriptions and structured data (Product schema).

Monitoring
- Add Google Analytics / GA4 and ensure privacy policy updated.
- Monitor Search Console for crawl errors and performance.
