// backend/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Video = require('../models/Video');
const Category = require('../models/Category');

// ==========================================
// CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dzjw6z7fy';
const SITE_NAME = 'Xmaster';
const DEFAULT_DESCRIPTION = 'Watch Videos Online on Xmaster';

// ==========================================
// HELPERS
// ==========================================

function getFrontendUrl() {
  var raw = process.env.FRONTEND_URL || 'https://xmaster.guru';
  if (raw.indexOf(',') !== -1) {
    raw = raw.split(',')[0].trim();
  }
  return raw.replace(/\/+$/, '');
}

function getBackendUrl() {
  // Used for thumbnail proxy URL
  var raw = process.env.BACKEND_URL || 'https://api.xmaster.guru';
  return raw.replace(/\/+$/, '');
}

/**
 * Build the BEST possible thumbnail URL for Telegram
 * 
 * RULES FOR TELEGRAM:
 * 1. Must be HTTPS
 * 2. Must return image/jpeg content-type
 * 3. Must NOT redirect (302/301 kills preview)
 * 4. Must be < 5MB
 * 5. Ideal size: 1280x720 (16:9)
 * 6. Must respond within 5 seconds
 * 7. URL must end with image extension OR return proper content-type
 */
function getTelegramOptimizedThumbnail(video) {
  // Strategy: Use our own proxy endpoint to guarantee
  // correct headers, no redirects, and fast response
  var backendUrl = getBackendUrl();
  
  // Option 1: Direct Cloudinary URL with transformations (preferred)
  if (video.cloudinary_public_id) {
    // Cloudinary direct URL with explicit format and dimensions
    // f_jpg forces JPEG format
    // w_1280,h_720,c_fill ensures exact dimensions
    // q_85 for good quality but reasonable size
    // fl_progressive for faster loading
    return 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
      '/image/upload/f_jpg,w_1280,h_720,c_fill,q_85,fl_progressive/' +
      video.cloudinary_public_id + '.jpg';
  }

  // Option 2: thumbnailUrl field
  if (video.thumbnailUrl && video.thumbnailUrl.startsWith('https://')) {
    if (video.thumbnailUrl.indexOf('cloudinary') !== -1) {
      // Add transformations to existing Cloudinary URL
      return video.thumbnailUrl.replace(
        '/upload/',
        '/upload/f_jpg,w_1280,h_720,c_fill,q_85,fl_progressive/'
      );
    }
    return video.thumbnailUrl;
  }

  // Option 3: thumbnail field
  if (video.thumbnail && video.thumbnail.startsWith('https://')) {
    if (video.thumbnail.indexOf('cloudinary') !== -1) {
      return video.thumbnail.replace(
        '/upload/',
        '/upload/f_jpg,w_1280,h_720,c_fill,q_85,fl_progressive/'
      );
    }
    return video.thumbnail;
  }

  // Option 4: Use proxy (guarantees correct headers)
  if (video.thumbnail || video.file_code) {
    return backendUrl + '/api/public/thumb/' + video._id + '.jpg';
  }

  return '';
}

/**
 * Detect social media crawler bots
 */
function isCrawlerBot(userAgent) {
  if (!userAgent) return false;
  var ua = userAgent.toLowerCase();
  var bots = [
    'telegrambot',
    'twitterbot',
    'facebookexternalhit',
    'facebot',
    'whatsapp',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'skypeuripreview',
    'viber',
    'vkshare',
    'pinterest',
    'embedly',
    'quora link preview',
    'redditbot',
    'applebot',
    'bingpreview',
    'googlebot',
    'yandexbot',
    'baiduspider',
    'seznambot',
  ];
  for (var i = 0; i < bots.length; i++) {
    if (ua.indexOf(bots[i]) !== -1) return true;
  }
  return false;
}

/**
 * Detect specifically Telegram bot
 */
function isTelegramBot(userAgent) {
  if (!userAgent) return false;
  return userAgent.toLowerCase().indexOf('telegrambot') !== -1;
}

/**
 * Escape string for safe HTML attribute insertion
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Clean and truncate description
 */
function cleanDescription(video) {
  var desc = video.description || '';
  if (!desc || desc.trim().length < 10) {
    desc = 'Watch ' + (video.title || 'this video') + ' on ' + SITE_NAME;
  }
  // Remove HTML tags
  desc = desc.replace(/<[^>]*>/g, '');
  // Truncate to 200 chars
  if (desc.length > 200) {
    desc = desc.substring(0, 197) + '...';
  }
  return desc;
}

/**
 * Format view count
 */
function formatViews(views) {
  if (!views || views === 0) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
}

// ==========================================
// SHARE PAGE - THE CRITICAL ENDPOINT
// ==========================================
// This is what Telegram/WhatsApp/Facebook will fetch
// URL: https://api.xmaster.guru/api/public/share/{videoId}
// ==========================================

router.get('/share/:id', async (req, res) => {
  try {
    // Validate ID format to prevent MongoDB errors
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.redirect(getFrontendUrl());
    }

    var video = await Video.findById(req.params.id);
    if (!video) {
      return res.redirect(getFrontendUrl());
    }

    var frontendUrl = getFrontendUrl();
    var videoPageUrl = frontendUrl + '/watch/' + video._id;
    if (video.slug) {
      videoPageUrl += '/' + encodeURIComponent(video.slug);
    }

    var thumbnail = getTelegramOptimizedThumbnail(video);
    var title = escapeHtml(video.title || 'Video');
    var description = escapeHtml(cleanDescription(video));
    var views = video.views || 0;
    var duration = video.duration || '';
    var userAgent = req.headers['user-agent'] || '';
    var botRequest = isCrawlerBot(userAgent);
    var telegramBot = isTelegramBot(userAgent);

    // Share page URL (self-referencing for og:url)
    var sharePageUrl = getBackendUrl() + '/api/public/share/' + video._id;

    // ==========================================
    // BUILD HTML RESPONSE
    // ==========================================
    var html = '<!DOCTYPE html>\n';
    html += '<html lang="en" prefix="og: http://ogp.me/ns#">\n';
    html += '<head>\n';
    html += '<meta charset="utf-8" />\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1" />\n';
    html += '<title>' + title + ' - ' + SITE_NAME + '</title>\n\n';

    // ==========================================
    // OPEN GRAPH TAGS (Critical for Telegram)
    // ==========================================
    // og:type MUST come first
    html += '<!-- OpenGraph Meta Tags -->\n';
    html += '<meta property="og:type" content="video.other" />\n';
    html += '<meta property="og:title" content="' + title + '" />\n';
    html += '<meta property="og:description" content="' + description + '" />\n';
    
    // og:url should point to the canonical URL where user lands
    html += '<meta property="og:url" content="' + sharePageUrl + '" />\n';
    html += '<meta property="og:site_name" content="' + SITE_NAME + '" />\n';
    html += '<meta property="og:locale" content="en_US" />\n';

    // ==========================================
    // IMAGE TAGS (Most critical for Telegram thumbnail)
    // ==========================================
    if (thumbnail) {
      html += '\n<!-- Image Tags (Telegram-optimized) -->\n';
      // Primary og:image
      html += '<meta property="og:image" content="' + thumbnail + '" />\n';
      // Secure URL (required for some crawlers)
      html += '<meta property="og:image:secure_url" content="' + thumbnail + '" />\n';
      // Explicit type - Telegram needs this
      html += '<meta property="og:image:type" content="image/jpeg" />\n';
      // Exact dimensions - Telegram needs this
      html += '<meta property="og:image:width" content="1280" />\n';
      html += '<meta property="og:image:height" content="720" />\n';
      // Alt text
      html += '<meta property="og:image:alt" content="' + title + '" />\n';
    }

    // ==========================================
    // TWITTER CARD TAGS
    // ==========================================
    html += '\n<!-- Twitter Card Tags -->\n';
    html += '<meta name="twitter:card" content="summary_large_image" />\n';
    html += '<meta name="twitter:title" content="' + title + '" />\n';
    html += '<meta name="twitter:description" content="' + description + '" />\n';
    if (thumbnail) {
      html += '<meta name="twitter:image" content="' + thumbnail + '" />\n';
      html += '<meta name="twitter:image:src" content="' + thumbnail + '" />\n';
    }

    // ==========================================
    // ADDITIONAL SEO META TAGS
    // ==========================================
    html += '\n<!-- Additional Meta -->\n';
    html += '<meta name="description" content="' + description + '" />\n';
    html += '<link rel="canonical" href="' + sharePageUrl + '" />\n';
    if (thumbnail) {
      html += '<link rel="image_src" href="' + thumbnail + '" />\n';
    }

    // ==========================================
    // TELEGRAM-SPECIFIC: Allow bot to index
    // ==========================================
    html += '<meta name="robots" content="index, follow" />\n';

    // ==========================================
    // RESPONSE BASED ON REQUESTER TYPE
    // ==========================================
    if (botRequest) {
      // ======================
      // BOT RESPONSE
      // Minimal HTML, just OG tags + basic content
      // NO redirect, NO JavaScript
      // ======================
      html += '</head>\n';
      html += '<body>\n';
      html += '<h1>' + title + '</h1>\n';
      if (thumbnail) {
        html += '<img src="' + thumbnail + '" alt="' + title + '" width="1280" height="720" />\n';
      }
      html += '<p>' + description + '</p>\n';
      if (duration) {
        html += '<p>Duration: ' + duration + '</p>\n';
      }
      html += '<p>Views: ' + formatViews(views) + '</p>\n';
      html += '<a href="' + videoPageUrl + '">Watch on ' + SITE_NAME + '</a>\n';
      html += '</body>\n';
      html += '</html>';
    } else {
      // ======================
      // HUMAN RESPONSE
      // Show brief loading screen, then redirect
      // ======================
      html += '<meta http-equiv="refresh" content="0;url=' + videoPageUrl + '" />\n';
      html += '<style>\n';
      html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
      html += 'body { background: #0f0f0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }\n';
      html += '.card { text-align: center; max-width: 400px; width: 100%; }\n';
      html += '.thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; margin-bottom: 16px; background: #1a1a1a; }\n';
      html += '.title { font-size: 16px; font-weight: 600; margin-bottom: 8px; line-height: 1.4; }\n';
      html += '.meta { color: #888; font-size: 13px; margin-bottom: 16px; }\n';
      html += '.btn { display: inline-block; padding: 12px 32px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }\n';
      html += '.btn:hover { background: #2563eb; }\n';
      html += '.loading { color: #666; font-size: 12px; margin-top: 12px; }\n';
      html += '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n';
      html += '.loading { animation: pulse 1.5s ease-in-out infinite; }\n';
      html += '</style>\n';
      html += '</head>\n';
      html += '<body>\n';
      html += '<div class="card">\n';
      if (thumbnail) {
        html += '<img class="thumb" src="' + thumbnail + '" alt="' + title + '" onerror="this.style.display=\'none\'" />\n';
      }
      html += '<div class="title">' + title + '</div>\n';
      html += '<div class="meta">';
      if (duration) html += duration + ' &bull; ';
      html += formatViews(views) + ' views</div>\n';
      html += '<a class="btn" href="' + videoPageUrl + '">&#9654; Watch Video</a>\n';
      html += '<div class="loading">Redirecting to ' + SITE_NAME + '...</div>\n';
      html += '</div>\n';
      html += '<script>window.location.replace("' + videoPageUrl + '");</script>\n';
      html += '</body>\n';
      html += '</html>';
    }

    // ==========================================
    // RESPONSE HEADERS (Critical for Telegram)
    // ==========================================
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Don't cache for bots - allows re-scraping
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Allow all origins to fetch this
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Explicitly set status 200 (not 301/302)
    res.status(200).send(html);

  } catch (error) {
    console.error('Share page error:', error);
    res.redirect(getFrontendUrl());
  }
});


// ==========================================
// THUMBNAIL PROXY ENDPOINT
// ==========================================
// This guarantees:
// - Correct Content-Type header (image/jpeg)
// - No redirects
// - CORS headers
// - Fast response with caching
// 
// URL: /api/public/thumb/{videoId}.jpg
// ==========================================

router.get('/thumb/:idWithExt', async (req, res) => {
  try {
    // Strip .jpg extension if present
    var videoId = req.params.idWithExt.replace(/\.\w+$/, '');

    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).send('Not found');
    }

    var video = await Video.findById(videoId).lean();
    if (!video) return res.status(404).send('Not found');

    // Determine source thumbnail URL
    var thumbnailUrl = '';
    if (video.cloudinary_public_id) {
      thumbnailUrl = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
        '/image/upload/f_jpg,w_1280,h_720,c_fill,q_85/' +
        video.cloudinary_public_id + '.jpg';
    } else if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
      thumbnailUrl = video.thumbnailUrl;
    } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
      thumbnailUrl = video.thumbnail;
    } else if (video.file_code) {
      thumbnailUrl = 'https://abyss.to/splash/' + video.file_code + '.jpg';
    }

    if (!thumbnailUrl) {
      return res.status(404).send('No thumbnail');
    }

    // Fetch the image
    var imageResponse = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XmasterBot/1.0)',
        'Accept': 'image/*',
      },
    });

    var imageBuffer = Buffer.from(imageResponse.data);

    // Set headers that Telegram expects
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // No redirects - direct response
    res.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Thumb proxy error:', error.message);
    // Return a 1x1 transparent GIF as fallback
    var fallback = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.status(200).send(fallback);
  }
});


// ==========================================
// SHARE TRACKING ENDPOINT (Optional)
// ==========================================
// POST /api/public/share/:id/track
// Body: { platform: "telegram" | "whatsapp" | "facebook" | "twitter" | "copy" | "native" }
// ==========================================

router.post('/share/:id/track', async (req, res) => {
  try {
    var videoId = req.params.id;
    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    var platform = req.body.platform || 'unknown';
    var validPlatforms = ['telegram', 'whatsapp', 'facebook', 'twitter', 'copy', 'native', 'unknown'];
    if (validPlatforms.indexOf(platform) === -1) {
      platform = 'unknown';
    }

    var updateQuery = {
      $inc: {
        shares: 1,
      },
    };
    updateQuery.$inc['sharePlatforms.' + platform] = 1;

    await Video.findByIdAndUpdate(videoId, updateQuery);

    res.json({ success: true });
  } catch (error) {
    console.error('Share tracking error:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});


// ==========================================
// OG DEBUG ENDPOINT
// ==========================================
// GET /api/public/share/:id/debug
// Returns JSON with all the OG tag data for debugging
// ==========================================

router.get('/share/:id/debug', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    var video = await Video.findById(req.params.id).lean();
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    var frontendUrl = getFrontendUrl();
    var videoPageUrl = frontendUrl + '/watch/' + video._id;
    if (video.slug) {
      videoPageUrl += '/' + video.slug;
    }

    var thumbnail = getTelegramOptimizedThumbnail(video);

    // Test thumbnail accessibility
    var thumbnailStatus = 'unknown';
    var thumbnailContentType = 'unknown';
    var thumbnailSize = 'unknown';
    try {
      var testResponse = await axios.head(thumbnail, {
        timeout: 5000,
        maxRedirects: 5,
      });
      thumbnailStatus = testResponse.status;
      thumbnailContentType = testResponse.headers['content-type'] || 'not set';
      thumbnailSize = testResponse.headers['content-length'] || 'not set';
    } catch (e) {
      thumbnailStatus = 'ERROR: ' + e.message;
    }

    res.json({
      success: true,
      debug: {
        videoId: video._id,
        title: video.title,
        description: cleanDescription(video),
        slug: video.slug,
        videoPageUrl: videoPageUrl,
        shareUrl: getBackendUrl() + '/api/public/share/' + video._id,
        thumbnail: {
          computed: thumbnail,
          raw_thumbnail: video.thumbnail || null,
          raw_thumbnailUrl: video.thumbnailUrl || null,
          cloudinary_public_id: video.cloudinary_public_id || null,
          file_code: video.file_code || null,
          status: thumbnailStatus,
          contentType: thumbnailContentType,
          size: thumbnailSize,
        },
        telegramTest: {
          shareLink: 'https://t.me/share/url?url=' + encodeURIComponent(getBackendUrl() + '/api/public/share/' + video._id),
          webpageBotLink: 'Send this URL to @WebpageBot on Telegram: ' + getBackendUrl() + '/api/public/share/' + video._id,
          forceRefreshCommand: 'Send to @WebpageBot: ' + getBackendUrl() + '/api/public/share/' + video._id,
        },
        checks: {
          hasTitle: !!video.title,
          hasThumbnail: !!thumbnail,
          thumbnailIsHttps: thumbnail ? thumbnail.startsWith('https://') : false,
          thumbnailIsJpeg: thumbnail ? (thumbnail.indexOf('.jpg') !== -1 || thumbnail.indexOf('f_jpg') !== -1) : false,
          hasCloudinaryId: !!video.cloudinary_public_id,
        },
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', message: error.message });
  }
});


// ==========================================
// HOME DATA
// ==========================================
router.get('/home', async (req, res) => {
  try {
    var query = { status: 'public', isDuplicate: { $ne: true } };

    const [featuredVideos, latestVideos, trendingVideos, categories] = await Promise.all([
      Video.find(Object.assign({}, query, { featured: true }))
        .sort({ uploadDate: -1 }).limit(6).populate('category', 'name slug'),
      Video.find(query)
        .sort({ uploadDate: -1 }).limit(12).populate('category', 'name slug'),
      Video.find(query)
        .sort({ views: -1 }).limit(12).populate('category', 'name slug'),
      Category.find({ isActive: true }).sort({ order: 1 }).limit(10),
    ]);

    res.json({ success: true, data: { featuredVideos, latestVideos, trendingVideos, categories } });
  } catch (error) {
    console.error('Home Data Error:', error);
    res.status(500).json({ error: 'Failed to get home data' });
  }
});


// ==========================================
// STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    var query = { status: 'public', isDuplicate: { $ne: true } };

    const [videoCount, totalViews, categoryCount] = await Promise.all([
      Video.countDocuments(query),
      Video.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$views' } } }]),
      Category.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      stats: {
        videos: videoCount,
        views: totalViews[0]?.total || 0,
        categories: categoryCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});


module.exports = router;