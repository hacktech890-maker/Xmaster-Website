export async function onRequest(context) {
  const robotsTxt = `# Xmaster Robots.txt
# https://xmaster.guru

User-agent: *
Allow: /
Allow: /watch/
Allow: /search
Allow: /trending
Allow: /category/
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

# Sitemaps
Sitemap: https://xmaster.guru/sitemap.xml
Sitemap: https://api.xmaster.guru/api/public/sitemap.xml

# Crawl delay
User-agent: *
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}