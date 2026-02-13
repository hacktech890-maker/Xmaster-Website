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
  var raw = process.env.BACKEND_URL || 'https://api.xmaster.guru';
  return raw.replace(/\/+$/, '');
}

/**
 * Build the BEST possible thumbnail URL for Telegram
 * 
 * ALWAYS use the proxy endpoint because:
 * 1. Guarantees correct Content-Type header (image/jpeg)
 * 2. No redirects (Telegram hates redirects)
 * 3. Guaranteed HTTPS
 * 4. URL ends with .jpg (Telegram likes this)
 * 5. Serves a big enough image for large preview card
 * 6. Single consistent URL format for all videos
 */
function getTelegramOptimizedThumbnail(video) {
  var backendUrl = getBackendUrl();
  return backendUrl + '/api/public/thumb/' + video._id + '.jpg';
}

/**
 * Get the SOURCE thumbnail URL from Cloudinary or other sources
 * Used internally by the proxy endpoint
 */
function getSourceThumbnailUrl(video) {
  if (video.cloudinary_public_id) {
    return 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
      '/image/upload/w_1280,h_720,c_fill,q_90,f_jpg/' +
      video.cloudinary_public_id + '.jpg';
  }
  if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
    if (video.thumbnailUrl.indexOf('cloudinary') !== -1) {
      return video.thumbnailUrl.replace(
        '/upload/',
        '/upload/w_1280,h_720,c_fill,q_90,f_jpg/'
      );
    }
    return video.thumbnailUrl;
  }
  if (video.thumbnail && video.thumbnail.startsWith('http')) {
    if (video.thumbnail.indexOf('cloudinary') !== -1) {
      return video.thumbnail.replace(
        '/upload/',
        '/upload/w_1280,h_720,c_fill,q_90,f_jpg/'
      );
    }
    return video.thumbnail;
  }
  if (video.file_code) {
    return 'https://abyss.to/splash/' + video.file_code + '.jpg';
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
  desc = desc.replace(/<[^>]*>/g, '');
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

router.get('/share/:id', async (req, res) => {
  try {
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
    html += '<!-- OpenGraph Meta Tags -->\n';
    html += '<meta property="og:type" content="article" />\n';
    html += '<meta property="og:title" content="' + title + '" />\n';
    html += '<meta property="og:description" content="' + description + '" />\n';

    // og:url MUST point to THIS share page (not the React SPA)
    html += '<meta property="og:url" content="' + sharePageUrl + '" />\n';
    html += '<meta property="og:site_name" content="' + SITE_NAME + '" />\n';
    html += '<meta property="og:locale" content="en_US" />\n';

    // ==========================================
    // IMAGE TAGS (Telegram thumbnail)
    // Uses proxy URL → guaranteed big image, correct headers
    // ==========================================
    if (thumbnail) {
      html += '\n<!-- Image Tags (Telegram-optimized via proxy) -->\n';
      html += '<meta property="og:image" content="' + thumbnail + '" />\n';
      html += '<meta property="og:image:secure_url" content="' + thumbnail + '" />\n';
      html += '<meta property="og:image:type" content="image/jpeg" />\n';
      html += '<meta property="og:image:width" content="1280" />\n';
      html += '<meta property="og:image:height" content="720" />\n';
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

    html += '<meta name="robots" content="index, follow" />\n';

    // ==========================================
    // RESPONSE BASED ON REQUESTER TYPE
    // ==========================================
    if (botRequest) {
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

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(html);

  } catch (error) {
    console.error('Share page error:', error);
    res.redirect(getFrontendUrl());
  }
});


// ==========================================
// THUMBNAIL PROXY ENDPOINT
// ==========================================
// Serves the actual image to Telegram
// Guarantees: correct headers, big image, no redirects
// URL: /api/public/thumb/{videoId}.jpg
// ==========================================

router.get('/thumb/:idWithExt', async (req, res) => {
  try {
    var videoId = req.params.idWithExt.replace(/\.\w+$/, '');

    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).send('Not found');
    }

    var video = await Video.findById(videoId).lean();
    if (!video) return res.status(404).send('Not found');

    var thumbnailUrl = getSourceThumbnailUrl(video);

    if (!thumbnailUrl) {
      return res.status(404).send('No thumbnail');
    }

    // Fetch the image from source
    var imageResponse = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XmasterBot/1.0)',
        'Accept': 'image/*',
      },
    });

    var imageBuffer = Buffer.from(imageResponse.data);

    // Set all headers Telegram needs
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Thumb proxy error:', error.message);

    // Try fallback: original thumbnail without transforms
    try {
      var fallbackId = req.params.idWithExt.replace(/\.\w+$/, '');
      var video2 = await Video.findById(fallbackId).lean();
      if (video2) {
        var fallbackUrl = '';
        if (video2.thumbnail && video2.thumbnail.startsWith('http')) {
          fallbackUrl = video2.thumbnail;
        } else if (video2.file_code) {
          fallbackUrl = 'https://abyss.to/splash/' + video2.file_code + '.jpg';
        }
        if (fallbackUrl) {
          var fallbackResponse = await axios.get(fallbackUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; XmasterBot/1.0)',
            },
          });
          var fallbackBuffer = Buffer.from(fallbackResponse.data);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Length', fallbackBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=604800');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).send(fallbackBuffer);
        }
      }
    } catch (e2) {
      console.error('Thumb fallback error:', e2.message);
    }

    // Last resort: 1x1 transparent GIF
    var fallback = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.status(200).send(fallback);
  }
});


// ==========================================
// SHARE TRACKING ENDPOINT
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
    var sourceThumbnail = getSourceThumbnailUrl(video);

    // Test proxy thumbnail accessibility
    var proxyStatus = 'unknown';
    var proxyContentType = 'unknown';
    var proxySize = 'unknown';
    try {
      var testResponse = await axios.head(thumbnail, {
        timeout: 10000,
        maxRedirects: 0,
      });
      proxyStatus = testResponse.status;
      proxyContentType = testResponse.headers['content-type'] || 'not set';
      proxySize = testResponse.headers['content-length'] || 'not set';
    } catch (e) {
      proxyStatus = 'ERROR: ' + e.message;
    }

    // Test source thumbnail accessibility
    var sourceStatus = 'unknown';
    var sourceSize = 'unknown';
    try {
      var sourceResponse = await axios.head(sourceThumbnail, {
        timeout: 5000,
        maxRedirects: 5,
      });
      sourceStatus = sourceResponse.status;
      sourceSize = sourceResponse.headers['content-length'] || 'not set';
    } catch (e) {
      sourceStatus = 'ERROR: ' + e.message;
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
          proxy: thumbnail,
          source: sourceThumbnail,
          raw_thumbnail: video.thumbnail || null,
          raw_thumbnailUrl: video.thumbnailUrl || null,
          cloudinary_public_id: video.cloudinary_public_id || null,
          file_code: video.file_code || null,
          proxyStatus: proxyStatus,
          proxyContentType: proxyContentType,
          proxySize: proxySize,
          sourceStatus: sourceStatus,
          sourceSize: sourceSize,
        },
        telegramTest: {
          shareLink: 'https://t.me/share/url?url=' + encodeURIComponent(getBackendUrl() + '/api/public/share/' + video._id),
          webpageBotLink: 'Send this URL to @WebpageBot on Telegram: ' + getBackendUrl() + '/api/public/share/' + video._id,
          cacheBustTest: getBackendUrl() + '/api/public/share/' + video._id + '?v=' + Date.now(),
        },
        checks: {
          hasTitle: !!video.title,
          hasThumbnail: !!thumbnail,
          thumbnailIsHttps: thumbnail ? thumbnail.startsWith('https://') : false,
          thumbnailEndsWithJpg: thumbnail ? thumbnail.endsWith('.jpg') : false,
          hasCloudinaryId: !!video.cloudinary_public_id,
          proxyWorking: proxyStatus === 200,
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


// ==========================================
// DYNAMIC SITEMAP
// ==========================================
// ==========================================
// DYNAMIC SITEMAP - ENHANCED WITH VIDEO MARKUP
// ==========================================
router.get('/sitemap.xml', async (req, res) => {
  try {
    var frontendUrl = getFrontendUrl();
    var today = new Date().toISOString().split('T')[0];

    // Get total video count
    var totalVideos = await Video.countDocuments({
      status: 'public',
      isDuplicate: { $ne: true }
    });

    // If more than 5000 videos, serve a sitemap index
    if (totalVideos > 5000) {
      var totalSitemaps = Math.ceil(totalVideos / 5000);
      var sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Static pages sitemap
      sitemapIndex += '  <sitemap>\n';
      sitemapIndex += '    <loc>' + getBackendUrl() + '/api/public/sitemap-static.xml</loc>\n';
      sitemapIndex += '    <lastmod>' + today + '</lastmod>\n';
      sitemapIndex += '  </sitemap>\n';

      // Video sitemaps (paginated)
      for (var i = 0; i < totalSitemaps; i++) {
        sitemapIndex += '  <sitemap>\n';
        sitemapIndex += '    <loc>' + getBackendUrl() + '/api/public/sitemap-videos-' + (i + 1) + '.xml</loc>\n';
        sitemapIndex += '    <lastmod>' + today + '</lastmod>\n';
        sitemapIndex += '  </sitemap>\n';
      }

      sitemapIndex += '</sitemapindex>';

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(sitemapIndex);
    }

    // If 5000 or fewer videos, serve single sitemap
    var videos = await Video.find({
      status: 'public',
      isDuplicate: { $ne: true }
    })
      .sort({ uploadDate: -1 })
      .limit(5000)
      .select('_id slug title description thumbnail thumbnailUrl cloudinary_public_id uploadDate duration views tags')
      .lean();

    var categories = await Category.find({ isActive: true })
      .select('slug name updatedAt')
      .lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Homepage
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Trending
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/trending</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // Search
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/search</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Categories
    for (var c = 0; c < categories.length; c++) {
      var catLastmod = categories[c].updatedAt
        ? new Date(categories[c].updatedAt).toISOString().split('T')[0]
        : today;
      xml += '  <url>\n';
      xml += '    <loc>' + frontendUrl + '/category/' + encodeURIComponent(categories[c].slug) + '</loc>\n';
      xml += '    <lastmod>' + catLastmod + '</lastmod>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Videos with video sitemap markup
    for (var v = 0; v < videos.length; v++) {
      var video = videos[v];
      var videoUrl = frontendUrl + '/watch/' + video._id;
      if (video.slug) {
        videoUrl += '/' + encodeURIComponent(video.slug);
      }
      var lastmod = video.uploadDate
        ? new Date(video.uploadDate).toISOString().split('T')[0]
        : '';

      // Get thumbnail URL
      var thumbUrl = '';
      if (video.cloudinary_public_id) {
        thumbUrl = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
          '/image/upload/w_1280,h_720,c_fill,q_80,f_jpg/' +
          video.cloudinary_public_id + '.jpg';
      } else if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
        thumbUrl = video.thumbnailUrl;
      } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
        thumbUrl = video.thumbnail;
      }

      // Escape XML special characters
      var safeTitle = (video.title || 'Video')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      var safeDesc = (video.description || video.title || 'Watch this video on Xmaster')
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      if (safeDesc.length > 2048) {
        safeDesc = safeDesc.substring(0, 2045) + '...';
      }

      xml += '  <url>\n';
      xml += '    <loc>' + videoUrl + '</loc>\n';
      if (lastmod) {
        xml += '    <lastmod>' + lastmod + '</lastmod>\n';
      }
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';

      // Video sitemap extension
      if (thumbUrl) {
        xml += '    <video:video>\n';
        xml += '      <video:thumbnail_loc>' + thumbUrl + '</video:thumbnail_loc>\n';
        xml += '      <video:title>' + safeTitle + '</video:title>\n';
        xml += '      <video:description>' + safeDesc + '</video:description>\n';
        xml += '      <video:player_loc allow_embed="yes">https://short.icu/' + (video.file_code || '') + '</video:player_loc>\n';
        if (video.duration && video.duration !== '00:00') {
          var dParts = video.duration.split(':').map(Number);
          var durationSec = 0;
          if (dParts.length === 3) durationSec = dParts[0] * 3600 + dParts[1] * 60 + dParts[2];
          else if (dParts.length === 2) durationSec = dParts[0] * 60 + dParts[1];
          if (durationSec > 0) {
            xml += '      <video:duration>' + durationSec + '</video:duration>\n';
          }
        }
        if (lastmod) {
          xml += '      <video:publication_date>' + lastmod + '</video:publication_date>\n';
        }
        if (video.views) {
          xml += '      <video:view_count>' + video.views + '</video:view_count>\n';
        }
        xml += '      <video:family_friendly>no</video:family_friendly>\n';
        xml += '      <video:live>no</video:live>\n';

        // Add tags (max 32 per Google spec)
        if (video.tags && video.tags.length > 0) {
          var maxTags = Math.min(video.tags.length, 32);
          for (var t = 0; t < maxTags; t++) {
            var safeTag = video.tags[t]
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            xml += '      <video:tag>' + safeTag + '</video:tag>\n';
          }
        }
        xml += '    </video:video>\n';
      }

      // Image sitemap extension
      if (thumbUrl) {
        xml += '    <image:image>\n';
        xml += '      <image:loc>' + thumbUrl + '</image:loc>\n';
        xml += '      <image:title>' + safeTitle + '</image:title>\n';
        xml += '    </image:image>\n';
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// STATIC PAGES SITEMAP (for sitemap index)
// ==========================================
router.get('/sitemap-static.xml', async (req, res) => {
  try {
    var frontendUrl = getFrontendUrl();
    var today = new Date().toISOString().split('T')[0];
    var categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/trending</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/search</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    for (var c = 0; c < categories.length; c++) {
      var catLastmod = categories[c].updatedAt
        ? new Date(categories[c].updatedAt).toISOString().split('T')[0]
        : today;
      xml += '  <url>\n';
      xml += '    <loc>' + frontendUrl + '/category/' + encodeURIComponent(categories[c].slug) + '</loc>\n';
      xml += '    <lastmod>' + catLastmod + '</lastmod>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Static sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// PAGINATED VIDEO SITEMAPS (for sitemap index)
// ==========================================
router.get('/sitemap-videos-:page.xml', async (req, res) => {
  try {
    var page = parseInt(req.params.page) || 1;
    var perPage = 5000;
    var skip = (page - 1) * perPage;
    var frontendUrl = getFrontendUrl();

    var videos = await Video.find({
      status: 'public',
      isDuplicate: { $ne: true }
    })
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(perPage)
      .select('_id slug title description thumbnail thumbnailUrl cloudinary_public_id uploadDate duration views tags file_code')
      .lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    for (var v = 0; v < videos.length; v++) {
      var video = videos[v];
      var videoUrl = frontendUrl + '/watch/' + video._id;
      if (video.slug) {
        videoUrl += '/' + encodeURIComponent(video.slug);
      }
      var lastmod = video.uploadDate
        ? new Date(video.uploadDate).toISOString().split('T')[0]
        : '';

      var thumbUrl = '';
      if (video.cloudinary_public_id) {
        thumbUrl = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
          '/image/upload/w_1280,h_720,c_fill,q_80,f_jpg/' +
          video.cloudinary_public_id + '.jpg';
      } else if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
        thumbUrl = video.thumbnailUrl;
      } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
        thumbUrl = video.thumbnail;
      }

      var safeTitle = (video.title || 'Video')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      var safeDesc = (video.description || video.title || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      if (safeDesc.length > 2048) safeDesc = safeDesc.substring(0, 2045) + '...';

      xml += '  <url>\n';
      xml += '    <loc>' + videoUrl + '</loc>\n';
      if (lastmod) xml += '    <lastmod>' + lastmod + '</lastmod>\n';
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';

      if (thumbUrl) {
        xml += '    <video:video>\n';
        xml += '      <video:thumbnail_loc>' + thumbUrl + '</video:thumbnail_loc>\n';
        xml += '      <video:title>' + safeTitle + '</video:title>\n';
        xml += '      <video:description>' + (safeDesc || safeTitle) + '</video:description>\n';
        xml += '      <video:player_loc allow_embed="yes">https://short.icu/' + (video.file_code || '') + '</video:player_loc>\n';
        if (video.duration && video.duration !== '00:00') {
          var dParts = video.duration.split(':').map(Number);
          var dSec = 0;
          if (dParts.length === 3) dSec = dParts[0] * 3600 + dParts[1] * 60 + dParts[2];
          else if (dParts.length === 2) dSec = dParts[0] * 60 + dParts[1];
          if (dSec > 0) xml += '      <video:duration>' + dSec + '</video:duration>\n';
        }
        if (lastmod) xml += '      <video:publication_date>' + lastmod + '</video:publication_date>\n';
        if (video.views) xml += '      <video:view_count>' + video.views + '</video:view_count>\n';
        xml += '      <video:family_friendly>no</video:family_friendly>\n';
        xml += '      <video:live>no</video:live>\n';
        if (video.tags && video.tags.length > 0) {
          var maxTags = Math.min(video.tags.length, 32);
          for (var t = 0; t < maxTags; t++) {
            xml += '      <video:tag>' + video.tags[t].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</video:tag>\n';
          }
        }
        xml += '    </video:video>\n';
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Video sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// ROBOTS.TXT (served from backend for API domain)
// ==========================================
router.get('/robots.txt', (req, res) => {
  var frontendUrl = getFrontendUrl();
  var backendUrl = getBackendUrl();

  var robots = '# Xmaster Robots.txt\n';
  robots += '# https://xmaster.guru\n\n';
  robots += 'User-agent: *\n';
  robots += 'Allow: /api/public/share/\n';
  robots += 'Allow: /api/public/sitemap.xml\n';
  robots += 'Disallow: /api/\n\n';
  robots += 'Sitemap: ' + frontendUrl + '/sitemap.xml\n';
  robots += 'Sitemap: ' + backendUrl + '/api/public/sitemap.xml\n';

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robots);
});

module.exports = router;