// backend/routes/shareRoutes.js

const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const { optimizeThumbnailForTelegram } = require('../middleware/ogRenderer');

// GET /api/share/:videoId - Get share-ready data for a video
router.get('/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .select('title description thumbnailUrl thumbnail views duration')
      .lean();
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';
    const siteName = process.env.SITE_NAME || 'XMaster';
    
    const shareData = {
      title: video.title || 'Untitled Video',
      description: video.description || `Watch this video on ${siteName}`,
      url: `${siteUrl}/watch/${video._id}`,
      thumbnailUrl: optimizeThumbnailForTelegram(
        video.thumbnailUrl || video.thumbnail || ''
      ),
      siteName,
    };
    
    res.json(shareData);
  } catch (error) {
    console.error('Share data error:', error);
    res.status(500).json({ error: 'Failed to get share data' });
  }
});

// POST /api/share/:videoId/track - Track share events (analytics)
router.post('/:videoId/track', async (req, res) => {
  try {
    const { platform } = req.body; // 'telegram', 'whatsapp', 'facebook', 'copy', 'native'
    
    await Video.findByIdAndUpdate(req.params.videoId, {
      $inc: { 
        shares: 1,
        [`sharePlatforms.${platform || 'unknown'}`]: 1
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Share tracking error:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});

// GET /api/share/:videoId/debug-og - Debug endpoint to test OG tags
router.get('/:videoId/debug-og', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .select('title description thumbnailUrl thumbnail')
      .lean();
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';
    const thumbnailUrl = optimizeThumbnailForTelegram(
      video.thumbnailUrl || video.thumbnail || ''
    );
    
    // Test if thumbnail is accessible
    let thumbnailStatus = 'unknown';
    try {
      const https = require('https');
      const http = require('http');
      const client = thumbnailUrl.startsWith('https') ? https : http;
      
      thumbnailStatus = await new Promise((resolve) => {
        client.get(thumbnailUrl, (response) => {
          resolve({
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length'],
            redirected: response.statusCode >= 300 && response.statusCode < 400,
            redirectUrl: response.headers['location'] || null,
          });
        }).on('error', (err) => {
          resolve({ error: err.message });
        });
      });
    } catch (e) {
      thumbnailStatus = { error: e.message };
    }
    
    res.json({
      videoId: req.params.videoId,
      ogTags: {
        'og:title': video.title,
        'og:description': video.description,
        'og:url': `${siteUrl}/watch/${video._id}`,
        'og:image': thumbnailUrl,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',
      },
      thumbnailAnalysis: {
        originalUrl: video.thumbnailUrl || video.thumbnail,
        optimizedUrl: thumbnailUrl,
        isHttps: thumbnailUrl.startsWith('https://'),
        isCloudinary: thumbnailUrl.includes('cloudinary.com'),
        hasTransformations: thumbnailUrl.includes('c_fill'),
        accessibility: thumbnailStatus,
      },
      telegramTestUrl: `https://t.me/iv?url=${encodeURIComponent(`${siteUrl}/watch/${video._id}`)}&rhash=none`,
      webpageBotInstruction: `Send this to @WebpageBot on Telegram: ${siteUrl}/watch/${video._id}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;