const express = require('express');
const router = express.Router();
const axios = require('axios');
const Video = require('../models/Video');
const Category = require('../models/Category');

// Helper: get single frontend URL (not comma-separated)
function getFrontendUrl() {
  var raw = process.env.FRONTEND_URL || 'https://xmaster.guru';
  // Handle comma-separated URLs - take first one only
  if (raw.indexOf(',') !== -1) {
    raw = raw.split(',')[0].trim();
  }
  // Remove trailing slash
  return raw.replace(/\/+$/, '');
}

// Helper: get best thumbnail URL for a video
function getBestThumbnail(video) {
  // 1. Cloudinary (original, no transforms - better quality)
  if (video.cloudinary_public_id) {
    return 'https://res.cloudinary.com/' +
      (process.env.CLOUDINARY_CLOUD_NAME || 'dzjw6z7fy') +
      '/image/upload/' + video.cloudinary_public_id + '.jpg';
  }
  // 2. Direct thumbnail URL from DB
  if (video.thumbnail && video.thumbnail.startsWith('http')) {
    return video.thumbnail;
  }
  // 3. Fallback
  return '';
}

// Helper: detect social media bots
function isBot(userAgent) {
  if (!userAgent) return false;
  var ua = userAgent.toLowerCase();
  var bots = [
    'telegrambot', 'twitterbot', 'facebookexternalhit', 'facebot',
    'whatsapp', 'linkedinbot', 'slackbot', 'discordbot', 'skypeuripreview',
    'viber', 'vkshare', 'pinterest', 'embedly', 'quora',
    'redditbot', 'applebot', 'bingpreview',
  ];
  for (var i = 0; i < bots.length; i++) {
    if (ua.indexOf(bots[i]) !== -1) return true;
  }
  return false;
}

// Helper: escape HTML
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==========================================
// GET /api/public/share/:id
// ==========================================
router.get('/share/:id', async (req, res) => {
  try {
    var video = await Video.findById(req.params.id);
    if (!video) {
      return res.redirect(getFrontendUrl());
    }

    var frontendUrl = getFrontendUrl();
    var videoPageUrl = frontendUrl + '/watch/' + video._id;
    if (video.slug) {
      videoPageUrl += '/' + video.slug;
    }

    var thumbnail = getBestThumbnail(video);
    var title = esc(video.title || 'Video');
    var description = esc(
      (video.description || 'Watch ' + video.title + ' on Xmaster').substring(0, 200)
    );
    var views = video.views || 0;
    var duration = video.duration || '';
    var userAgent = req.headers['user-agent'] || '';
    var botRequest = isBot(userAgent);

    var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
      '<meta charset="utf-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      '<title>' + title + ' - Xmaster</title>\n\n' +
      '<meta property="og:type" content="video.other" />\n' +
      '<meta property="og:title" content="' + title + '" />\n' +
      '<meta property="og:description" content="' + description + '" />\n';

    if (thumbnail) {
      html += '<meta property="og:image" content="' + thumbnail + '" />\n' +
        '<meta property="og:image:secure_url" content="' + thumbnail + '" />\n' +
        '<meta property="og:image:type" content="image/jpeg" />\n' +
        '<meta property="og:image:width" content="1280" />\n' +
        '<meta property="og:image:height" content="720" />\n' +
        '<meta property="og:image:alt" content="' + title + '" />\n';
    }

    html += '<meta property="og:url" content="' + videoPageUrl + '" />\n' +
      '<meta property="og:site_name" content="Xmaster" />\n' +
      '<meta property="og:locale" content="en_US" />\n\n' +
      '<meta name="twitter:card" content="summary_large_image" />\n' +
      '<meta name="twitter:title" content="' + title + '" />\n' +
      '<meta name="twitter:description" content="' + description + '" />\n';

    if (thumbnail) {
      html += '<meta name="twitter:image" content="' + thumbnail + '" />\n' +
        '<meta name="twitter:image:src" content="' + thumbnail + '" />\n';
    }

    html += '<meta name="description" content="' + description + '" />\n' +
      '<link rel="canonical" href="' + videoPageUrl + '" />\n';

    if (thumbnail) {
      html += '<link rel="image_src" href="' + thumbnail + '" />\n';
    }

    if (botRequest) {
      // Bots: just OG tags, no redirect
      html += '</head>\n<body>\n' +
        '<h1>' + title + '</h1>\n';
      if (thumbnail) {
        html += '<img src="' + thumbnail + '" alt="' + title + '" width="1280" height="720" />\n';
      }
      html += '<p>' + description + '</p>\n' +
        '<a href="' + videoPageUrl + '">Watch Video</a>\n' +
        '</body>\n</html>';
    } else {
      // Humans: instant redirect to video page
      html += '<meta http-equiv="refresh" content="0;url=' + videoPageUrl + '" />\n' +
        '<style>\n' +
        'body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}\n' +
        'img{max-width:400px;width:100%;border-radius:12px;margin-bottom:16px}\n' +
        'a{display:inline-block;padding:12px 32px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600}\n' +
        '</style>\n</head>\n<body>\n<div>\n';
      if (thumbnail) {
        html += '<img src="' + thumbnail + '" alt="' + title + '" />\n';
      }
      html += '<h2>' + title + '</h2>\n' +
        '<p style="color:#888;font-size:13px;margin-bottom:16px">' +
        (duration ? duration + ' &bull; ' : '') + views + ' views</p>\n' +
        '<a href="' + videoPageUrl + '">&#9654; Watch Video</a>\n' +
        '<p style="color:#666;font-size:12px;margin-top:12px">Redirecting...</p>\n' +
        '</div>\n' +
        '<script>window.location.replace("' + videoPageUrl + '");</script>\n' +
        '</body>\n</html>';
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Share page error:', error);
    res.redirect(getFrontendUrl());
  }
});

// ==========================================
// GET /api/public/thumb/:id
// ==========================================
router.get('/thumb/:id', async (req, res) => {
  try {
    var video = await Video.findById(req.params.id);
    if (!video) return res.status(404).send('Not found');

    var thumbnailUrl = getBestThumbnail(video);
    if (!thumbnailUrl) return res.status(404).send('No thumbnail');

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