export async function onRequest(context) {
  const robotsTxt = `# Xmaster Robots.txt
# https://xmaster.guru
User-agent: *
Allow: /
Allow: /trending
Allow: /free
Allow: /premium
Allow: /watch/
Allow: /search
Allow: /tag/
# Block admin pages
Disallow: /admin/
Disallow: /xmaster-admin
Disallow: /api/
# Allow social media bots
User-agent: TelegramBot
Allow: /
User-agent: Twitterbot
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: WhatsApp
Allow: /
# Googlebot specific
User-agent: Googlebot
Allow: /
Crawl-delay: 1
# Sitemaps
Sitemap: https://xmaster.guru/sitemap.xml`;
  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
