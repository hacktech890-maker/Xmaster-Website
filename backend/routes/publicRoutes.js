const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Category = require('../models/Category');

// ==========================================
// GET /api/public/oembed/:id - Open Graph data for sharing
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
// GET /api/public/share/:id - Returns full HTML page with OG tags
// Telegram/WhatsApp/Facebook bots will fetch this URL
// ==========================================
router.get('/share/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).send('Video not found');
    }

    let thumbnail = video.thumbnail || '';
    if (!thumbnail.startsWith('http')) {
      thumbnail = `https://abyss.to/splash/${video.file_code}.jpg`;
    }

    const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    const videoUrl = `${siteUrl}/watch/${video._id}${video.slug ? '/' + video.slug : ''}`;
    const title = (video.title || 'Video').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const description = (video.description || `Watch ${video.title} on Xmaster`).replace(/"/g, '&quot;').replace(/</g, '&lt;');

    // Serve an HTML page with proper OG tags that redirects to the actual video page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - Xmaster</title>
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="video.other" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${thumbnail}" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="720" />
  <meta property="og:url" content="${videoUrl}" />
  <meta property="og:site_name" content="Xmaster" />
  <meta property="og:video:duration" content="${video.duration_seconds || 0}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${thumbnail}" />
  
  <!-- Telegram specific -->
  <meta property="og:image:alt" content="${title}" />
  
  <!-- Auto redirect to actual video page -->
  <meta http-equiv="refresh" content="0; url=${videoUrl}" />
  
  <style>
    body {
      background: #0f0f0f;
      color: #fff;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 400px; width: 100%; border-radius: 12px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div>
    <img src="${thumbnail}" alt="${title}" />
    <h2>${title}</h2>
    <p>Redirecting to video...</p>
    <p><a href="${videoUrl}">Click here if not redirected</a></p>
  </div>
  <script>window.location.href = "${videoUrl}";</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Share page error:', error);
    const siteUrl = process.env.FRONTEND_URL || 'https://xmaster.guru';
    res.redirect(siteUrl);
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