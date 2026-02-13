export async function onRequest(context) {
  const BACKEND_SITEMAP_URL = "https://api.xmaster.guru/api/public/sitemap.xml";

  try {
    const response = await fetch(BACKEND_SITEMAP_URL, {
      headers: {
        "User-Agent": "Cloudflare-Pages-Function/1.0",
        "Accept": "application/xml",
      },
      cf: {
        cacheTtl: 3600,
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      // If backend is down, return a minimal valid sitemap
      const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://xmaster.guru/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://xmaster.guru/trending</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://xmaster.guru/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

      return new Response(fallbackXml, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const xmlContent = await response.text();

    return new Response(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    // Error fallback
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://xmaster.guru/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(errorXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}