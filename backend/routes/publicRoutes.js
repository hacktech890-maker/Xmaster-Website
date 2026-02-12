const express = require('express');
const router = express.Router();
const axios = require('axios');
const Video = require('../models/Video');
const Category = require('../models/Category');

// ==========================================
// Bot detection helper
// ==========================================
function isBot(userAgent) {
  if (!userAgent) return false;
  var ua = userAgent.toLowerCase();
  var bots = [
    'telegrambot', 'twitterbot', 'facebookexternalhit', 'facebot',
    'whatsapp', 'linkedinbot', 'slackbot', 'discordbot', 'skypeuripreview',
    'viber', 'vkshare', 'pinterest', 'embedly', 'quora',
    'redditbot', 'applebot', 'bingpreview', 'googlebot',
  ];
  for (var i = 0; i < bots.length; i++) {
    if (ua.indexOf(bots[i]) !== -1) return true;
  }
  return false;
}

// ==========================================
// GET /api/public/share/:id - Smart share endpoint
// Bots get OG tags HTML, humans get instant redirect
// ==========================================
router.get('/share/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      var siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
      return res.redirect(siteUrl);
    }

    var frontendUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    var videoPageUrl = frontendUrl + '/watch/' + video._id + (video.slug ? '/' + video.slug : '');

    // Get thumbnail - prefer cloudinary
    var thumbnail = '';
    if (video.cloudinary_public_id) {
      thumbnail = 'https://res.cloudinary.com/' + (process.env.CLOUDINARY_CLOUD_NAME || 'dzjw6z7fy') + '/image/upload/w_1280,h_720,c_fill/' + video.cloudinary_public_id + '.jpg';
    } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
      thumbnail = video.thumbnail;
    } else {
      thumbnail = 'https://abyss.to/splash/' + video.file_code + '.jpg';
    }

    var userAgent = req.headers['user-agent'] || '';
    var isBotRequest = isBot(userAgent);

    // Escape HTML
    var title = (video.title || 'Video')
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var description = (video.description || 'Watch ' + video.title + ' on Xmaster')
      .substring(0, 200)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var views = video.views || 0;
    var duration = video.duration || '';

    // Always serve HTML with OG tags
    // Bots will read the OG tags
    // Humans will be redirected instantly via JavaScript
    var html = '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '<meta charset="utf-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      '<title>' + title + ' - Xmaster</title>\n' +
      '\n' +
      '<meta property="og:type" content="video.other" />\n' +
      '<meta property="og:title" content="' + title + '" />\n' +
      '<meta property="og:description" content="' + description + '" />\n' +
      '<meta property="og:image" content="' + thumbnail + '" />\n' +
      '<meta property="og:image:secure_url" content="' + thumbnail + '" />\n' +
      '<meta property="og:image:type" content="image/jpeg" />\n' +
      '<meta property="og:image:width" content="1280" />\n' +
      '<meta property="og:image:height" content="720" />\n' +
      '<meta property="og:image:alt" content="' + title + '" />\n' +
      '<meta property="og:url" content="' + videoPageUrl + '" />\n' +
      '<meta property="og:site_name" content="Xmaster" />\n' +
      '<meta property="og:locale" content="en_US" />\n' +
      '\n' +
      '<meta name="twitter:card" content="summary_large_image" />\n' +
      '<meta name="twitter:title" content="' + title + '" />\n' +
      '<meta name="twitter:description" content="' + description + '" />\n' +
      '<meta name="twitter:image" content="' + thumbnail + '" />\n' +
      '<meta name="twitter:image:src" content="' + thumbnail + '" />\n' +
      '\n' +
      '<meta name="description" content="' + description + '" />\n' +
      '<link rel="canonical" href="' + videoPageUrl + '" />\n' +
      '<link rel="image_src" href="' + thumbnail + '" />\n' +
      '\n';

    if (isBotRequest) {
      // For bots: don't redirect, let them read OG tags
      html += '</head>\n' +
        '<body>\n' +
        '<h1>' + title + '</h1>\n' +
        '<img src="' + thumbnail + '" alt="' + title + '" />\n' +
        '<p>' + description + '</p>\n' +
        '<a href="' + videoPageUrl + '">Watch Video</a>\n' +
        '</body>\n</html>';
    } else {
      // For humans: instant redirect
      html += '<meta http-equiv="refresh" content="0; url=' + videoPageUrl + '" />\n' +
        '<style>\n' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        'body { background: #0f0f0f; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; }\n' +
        'img { max-width: 400px; width: 100%; border-radius: 12px; margin-bottom: 16px; }\n' +
        'h2 { font-size: 18px; margin-bottom: 8px; }\n' +
        '.meta { color: #888; font-size: 13px; margin-bottom: 16px; }\n' +
        'a { display: inline-block; padding: 12px 32px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div>\n' +
        '<img src="' + thumbnail + '" alt="' + title + '" />\n' +
        '<h2>' + title + '</h2>\n' +
        '<p class="meta">' + (duration ? duration + ' &bull; ' : '') + views + ' views</p>\n' +
        '<a href="' + videoPageUrl + '">&#9654; Watch Video</a>\n' +
        '<p style="color:#666;font-size:12px;margin-top:12px">Redirecting...</p>\n' +
        '</div>\n' +
        '<script>window.location.replace("' + videoPageUrl + '");</script>\n' +
        '</body>\n</html>';
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
  } catch (error) {
    console.error('Share page error:', error);
    var siteUrl2 = process.env.FRONTEND_URL || 'https://xmaster.guru';
    res.redirect(siteUrl2);
  }
});

// ==========================================
// GET /api/public/thumb/:id - Proxy thumbnail
// ==========================================
router.get('/thumb/:id', async (req, res) => {
  try {
    var video = await Video.findById(req.params.id);
    if (!video) return res.status(404).send('Not found');

    var thumbnailUrl = '';
    if (video.cloudinary_public_id) {
      thumbnailUrl = 'https://res.cloudinary.com/' + (process.env.CLOUDINARY_CLOUD_NAME || 'dzjw6z7fy') + '/image/upload/w_1280,h_720,c_fill/' + video.cloudinary_public_id + '.jpg';
    } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
      thumbnailUrl = video.thumbnail;
    } else {
      thumbnailUrl = 'https://abyss.to/splash/' + video.file_code + '.jpg';
    }

    var imageResponse = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(imageResponse.data));
  } catch (error) {
    var fallback = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.send(fallback);
  }
});

// ==========================================
// GET /api/public/home
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
      Category.find({ isActive: true }).sort({ order: 1 }).limit(10)
    ]);

    res.json({ success: true, data: { featuredVideos, latestVideos, trendingVideos, categories } });
  } catch (error) {
    console.error('Home Data Error:', error);
    res.status(500).json({ error: 'Failed to get home data' });
  }
});

// ==========================================
// GET /api/public/stats
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    var query = { status: 'public', isDuplicate: { $ne: true } };

    const [videoCount, totalViews, categoryCount] = await Promise.all([
      Video.countDocuments(query),
      Video.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$views' } } }]),
      Category.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      stats: { videos: videoCount, views: totalViews[0]?.total || 0, categories: categoryCount }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;