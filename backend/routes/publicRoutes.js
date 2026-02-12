const express = require('express');
const router = express.Router();
const axios = require('axios');
const Video = require('../models/Video');
const Category = require('../models/Category');

// ==========================================
// GET /api/public/thumb/:id - Proxy thumbnail image
// Telegram/WhatsApp bots fetch this to show preview
// ==========================================
router.get('/thumb/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).send('Not found');
    }

    let thumbnailUrl = video.thumbnail || '';
    if (!thumbnailUrl.startsWith('http')) {
      thumbnailUrl = `https://abyss.to/splash/${video.file_code}.jpg`;
    }

    // Fetch the actual image and proxy it
    const imageResponse = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(imageResponse.data));
  } catch (error) {
    console.error('Thumb proxy error:', error.message);
    
    // Return a 1x1 pixel fallback so it doesn't break
    const fallbackPixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.send(fallbackPixel);
  }
});

// ==========================================
// GET /api/public/share/:id - Share page with OG tags
// This is the URL shared to Telegram/WhatsApp/Facebook
// ==========================================
router.get('/share/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
      return res.redirect(siteUrl);
    }

    const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    const apiUrl = process.env.API_URL || `https://api.xmaster.guru/api`;
    const videoUrl = `${siteUrl}/watch/${video._id}${video.slug ? '/' + video.slug : ''}`;
    
    // Use proxied thumbnail URL - this guarantees Telegram can access it
    const thumbnailUrl = `${apiUrl}/public/thumb/${video._id}`;
    
    // Also prepare direct thumbnail as fallback
    let directThumb = video.thumbnail || '';
    if (!directThumb.startsWith('http')) {
      directThumb = `https://abyss.to/splash/${video.file_code}.jpg`;
    }
    
    // Cloudinary thumbnail (if exists) - best quality
    const cloudinaryThumb = video.cloudinary_public_id 
      ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_1280,h_720,c_fill/${video.cloudinary_public_id}.jpg`
      : null;

    // Pick best thumbnail: cloudinary > proxied > direct
    const bestThumb = cloudinaryThumb || thumbnailUrl;

    const title = (video.title || 'Video')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const description = (video.description || `▶️ Watch ${video.title} on Xmaster`)
      .substring(0, 200)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const duration = video.duration || '';
    const views = video.views || 0;

    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - Xmaster</title>
  
  <!-- Primary Open Graph Tags (Telegram reads these) -->
  <meta property="og:type" content="video.other" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${bestThumb}" />
  <meta property="og:image:secure_url" content="${bestThumb}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="720" />
  <meta property="og:image:alt" content="${title}" />
  <meta property="og:url" content="${videoUrl}" />
  <meta property="og:site_name" content="Xmaster" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Fallback image -->
  <meta property="og:image" content="${directThumb}" />
  
  <!-- Video specific -->
  <meta property="og:video:duration" content="${video.duration_seconds || 0}" />
  <meta property="video:duration" content="${video.duration_seconds || 0}" />
  
  <!-- Twitter Card (WhatsApp also reads these) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${bestThumb}" />
  <meta name="twitter:image:src" content="${bestThumb}" />
  
  <!-- Additional meta for various platforms -->
  <meta name="description" content="${description}" />
  <meta name="author" content="Xmaster" />
  <link rel="canonical" href="${videoUrl}" />
  <link rel="image_src" href="${bestThumb}" />
  
  <!-- Telegram specific hint -->
  <meta name="telegram:channel" content="@xmaster" />
  
  <!-- Auto redirect to actual video page -->
  <meta http-equiv="refresh" content="0; url=${videoUrl}" />
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f0f0f;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 500px; }
    img {
      width: 100%;
      max-width: 480px;
      border-radius: 12px;
      margin-bottom: 16px;
      aspect-ratio: 16/9;
      object-fit: cover;
      background: #1e1e1e;
    }
    h1 { font-size: 18px; margin-bottom: 8px; line-height: 1.4; }
    .meta { color: #888; font-size: 13px; margin-bottom: 16px; }
    a {
      display: inline-block;
      padding: 12px 32px;
      background: #3b82f6;
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    a:hover { background: #2563eb; }
    .loading { color: #666; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${directThumb}" alt="${title}" onerror="this.style.display='none'" />
    <h1>${title}</h1>
    <p class="meta">${duration ? duration + ' • ' : ''}${views} views • Xmaster</p>
    <a href="${videoUrl}">▶️ Watch Video</a>
    <p class="loading">Redirecting...</p>
  </div>
  <script>
    setTimeout(function() {
      window.location.replace("${videoUrl}");
    }, 100);
  </script>
</body>
</html>`;

    // Important: Set correct headers for social media bots
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(html);
  } catch (error) {
    console.error('Share page error:', error);
    const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    res.redirect(siteUrl);
  }
});

// ==========================================
// GET /api/public/oembed/:id - JSON data for sharing
// ==========================================
router.get('/oembed/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let thumbnail = video.thumbnail || '';
    if (!thumbnail.startsWith('http')) {
      thumbnail = `https://abyss.to/splash/${video.file_code}.jpg`;
    }

    const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    const videoUrl = `${siteUrl}/watch/${video._id}${video.slug ? '/' + video.slug : ''}`;

    res.json({
      success: true,
      title: video.title,
      description: video.description || `Watch ${video.title} on Xmaster`,
      thumbnail: thumbnail,
      url: videoUrl,
      duration: video.duration || '00:00',
      views: video.views || 0,
      site_name: 'Xmaster',
    });
  } catch (error) {
    console.error('OEmbed Error:', error);
    res.status(500).json({ error: 'Failed to get video data' });
  }
});

// ==========================================
// GET /api/public/home
// ==========================================
router.get('/home', async (req, res) => {
  try {
    const [featuredVideos, latestVideos, trendingVideos, categories] = await Promise.all([
      Video.find({ status: 'public', featured: true, isDuplicate: { $ne: true } })
        .sort({ uploadDate: -1 })
        .limit(6)
        .populate('category', 'name slug'),
      Video.find({ status: 'public', isDuplicate: { $ne: true } })
        .sort({ uploadDate: -1 })
        .limit(12)
        .populate('category', 'name slug'),
      Video.find({ status: 'public', isDuplicate: { $ne: true } })
        .sort({ views: -1 })
        .limit(12)
        .populate('category', 'name slug'),
      Category.find({ isActive: true })
        .sort({ order: 1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      data: { featuredVideos, latestVideos, trendingVideos, categories }
    });
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
    const [videoCount, totalViews, categoryCount] = await Promise.all([
      Video.countDocuments({ status: 'public', isDuplicate: { $ne: true } }),
      Video.aggregate([
        { $match: { status: 'public', isDuplicate: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Category.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      stats: {
        videos: videoCount,
        views: totalViews[0]?.total || 0,
        categories: categoryCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;