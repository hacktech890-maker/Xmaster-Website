// backend/middleware/ogRenderer.js

const Video = require('../models/Video');

// Comprehensive bot detection - covers Telegram, WhatsApp, Facebook, Twitter, Discord, etc.
const BOT_USER_AGENTS = [
  'TelegramBot',
  'telegrambot',
  'Telegram',
  'WhatsApp',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'vkShare',
  'Viber',
  'Googlebot',
  'bingbot',
  'Applebot',
  'PinterestBot',
  'redditbot',
  'Embedly',
  'Quora Link Preview',
  'Showyoubot',
  'outbrain',
  'W3C_Validator',
  'rogerbot',
  'Yahoo! Slurp',
  'Baiduspider',
  'DuckDuckBot',
  'Sogou',
  'ia_archiver',
  'curl',          // useful for testing
  'wget',
  'Postman',
];

function isBotRequest(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

// Ensure Cloudinary URL is optimized for Telegram
function optimizeThumbnailForTelegram(cloudinaryUrl) {
  if (!cloudinaryUrl) return '';
  
  // If it's a Cloudinary URL, apply transformations for Telegram compatibility
  // Telegram requirements:
  // - MUST be JPEG or PNG (no WebP for preview)
  // - Recommended: 1200x630 pixels (1.91:1 ratio)
  // - MUST be under 5MB
  // - MUST be served over HTTPS
  // - MUST NOT redirect (direct URL)
  // - MUST return proper Content-Type header
  
  if (cloudinaryUrl.includes('cloudinary.com')) {
    // Insert Cloudinary transformations for optimal Telegram preview
    // c_fill = crop to fill, w_1200, h_630 = dimensions, f_jpg = force JPEG, q_85 = quality
    const transformed = cloudinaryUrl.replace(
      '/upload/',
      '/upload/c_fill,w_1200,h_630,f_jpg,q_85/'
    );
    return transformed;
  }
  
  return cloudinaryUrl;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncateDescription(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

async function ogRenderer(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  
  // Only intercept for bot requests to video watch pages
  // Match patterns like /watch/:id or /video/:id
  const watchMatch = req.path.match(/^\/(watch|video)\/([a-zA-Z0-9_-]+)/);
  
  if (!watchMatch || !isBotRequest(userAgent)) {
    return next(); // Not a bot or not a video page, continue normally
  }
  
  const videoId = watchMatch[2];
  
  try {
    const video = await Video.findById(videoId).lean();
    
    if (!video) {
      return next(); // Video not found, serve normal page
    }
    
    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';
    const siteName = process.env.SITE_NAME || 'XMaster';
    
    const title = escapeHtml(video.title || 'Untitled Video');
    const description = escapeHtml(
      truncateDescription(video.description || `Watch ${video.title} on ${siteName}`)
    );
    const videoUrl = `${siteUrl}/watch/${video._id}`;
    const thumbnailUrl = optimizeThumbnailForTelegram(
      video.thumbnailUrl || video.thumbnail || ''
    );
    
    // Duration formatting for video meta
    const duration = video.duration || 0;
    const durationISO = `PT${Math.floor(duration / 60)}M${duration % 60}S`;
    
    // Build the complete HTML response for bots
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title} - ${siteName}</title>
    <meta name="title" content="${title} - ${siteName}">
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / Telegram -->
    <meta property="og:type" content="video.other">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:url" content="${videoUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnailUrl}">
    <meta property="og:image:secure_url" content="${thumbnailUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${title}">
    <meta property="og:locale" content="en_US">
    
    <!-- Video specific OG tags -->
    <meta property="og:video:duration" content="${duration}">
    <meta property="video:duration" content="${durationISO}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${videoUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${thumbnailUrl}">
    <meta name="twitter:image:alt" content="${title}">
    
    <!-- Telegram Specific -->
    <meta name="telegram:channel" content="@yourchannel">
    
    <!-- Additional SEO -->
    <link rel="canonical" href="${videoUrl}">
    <meta name="robots" content="index, follow">
    
    <!-- Schema.org JSON-LD for rich results -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": "${title}",
        "description": "${description}",
        "thumbnailUrl": "${thumbnailUrl}",
        "uploadDate": "${video.createdAt || new Date().toISOString()}",
        "duration": "${durationISO}",
        "contentUrl": "${videoUrl}",
        "embedUrl": "${videoUrl}",
        "interactionStatistic": {
            "@type": "InteractionCounter",
            "interactionType": { "@type": "WatchAction" },
            "userInteractionCount": ${video.views || 0}
        }
    }
    </script>
    
    <!-- Redirect real users (non-bots) to the SPA -->
    <noscript>
        <meta http-equiv="refresh" content="0;url=${videoUrl}">
    </noscript>
</head>
<body>
    <!-- Minimal content for crawlers -->
    <article>
        <h1>${title}</h1>
        <p>${description}</p>
        <img src="${thumbnailUrl}" alt="${title}" width="1200" height="630">
        <a href="${videoUrl}">Watch Video</a>
    </article>
</body>
</html>`;

    // Set proper headers for bot responses
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'index, follow',
    });
    
    return res.status(200).send(html);
    
  } catch (error) {
    console.error('OG Renderer Error:', error.message);
    return next(); // On error, fall through to normal serving
  }
}

module.exports = { ogRenderer, isBotRequest, optimizeThumbnailForTelegram };