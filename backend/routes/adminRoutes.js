const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Video = require('../models/Video');
const Category = require('../models/Category');
const Ad = require('../models/Ad');
const Report = require('../models/Report');

// Simple Admin Auth Middleware
const simpleAdminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(401).json({ error: 'Invalid admin token.' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

function getBackendUrl() {
  var raw = process.env.BACKEND_URL || 'https://api.xmaster.guru';
  return raw.replace(/\/+$/, '');
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  try {
    const { password, username } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { isAdmin: true, username: username || 'admin', loginTime: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        token,
        admin: { username: username || 'admin', role: 'admin' },
        message: 'Login successful'
      });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/verify
router.post('/verify', simpleAdminAuth, (req, res) => {
  res.json({ success: true, admin: req.admin, message: 'Token is valid' });
});

// GET /api/admin/dashboard
router.get('/dashboard', simpleAdminAuth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalVideos, publicVideos, totalViewsResult, totalCategories, totalAds, pendingReports, todayVideos, weekVideos, sharedOnTGCount] = await Promise.all([
      Video.countDocuments(),
      Video.countDocuments({ status: 'public' }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Category.countDocuments({ isActive: true }),
      Ad.countDocuments({ enabled: true }),
      Report.countDocuments({ status: 'pending' }),
      Video.countDocuments({ uploadDate: { $gte: today } }),
      Video.countDocuments({ uploadDate: { $gte: weekAgo } }),
      Video.countDocuments({ sharedOnTG: true })
    ]);

    const topVideos = await Video.find({ status: 'public' })
      .sort({ views: -1 })
      .limit(5)
      .select('title thumbnail views uploadDate');

    const recentUploads = await Video.find()
      .sort({ uploadDate: -1 })
      .limit(5)
      .select('title thumbnail views status uploadDate');

    res.json({
      success: true,
      stats: {
        totalVideos,
        publicVideos,
        totalViews: totalViewsResult[0]?.total || 0,
        totalCategories,
        totalAds,
        pendingReports,
        todayVideos,
        weekVideos,
        sharedOnTGCount
      },
      topVideos,
      recentUploads,
      viewsByDay: []
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// GET /api/admin/videos
router.get('/videos', simpleAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', featured = '', sort = 'newest', sharedOnTG = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { file_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (featured === 'true') query.featured = true;
    if (featured === 'false') query.featured = false;
    if (sharedOnTG === 'true') query.sharedOnTG = true;
    if (sharedOnTG === 'false') { query.sharedOnTG = { $ne: true }; }

    let sortOption = {};
    switch (sort) {
      case 'oldest': sortOption = { uploadDate: 1 }; break;
      case 'views': sortOption = { views: -1 }; break;
      case 'title': sortOption = { title: 1 }; break;
      default: sortOption = { uploadDate: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [videos, total] = await Promise.all([
      Video.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(parseInt(limit)),
      Video.countDocuments(query)
    ]);

    res.json({
      success: true,
      videos,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get Videos Error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

// ==========================================
// BULK SHARE TO TELEGRAM
// ==========================================

// GET /api/admin/videos/tg-share-stats
// Returns count of eligible videos for sharing
router.get('/videos/tg-share-stats', simpleAdminAuth, async (req, res) => {
  try {
    const eligible = await Video.countDocuments({
      status: 'public',
      isDuplicate: { $ne: true },
      sharedOnTG: { $ne: true },
    });

    const alreadyShared = await Video.countDocuments({
      sharedOnTG: true,
    });

    const totalPublic = await Video.countDocuments({
      status: 'public',
      isDuplicate: { $ne: true },
    });

    res.json({
      success: true,
      stats: {
        eligible,
        alreadyShared,
        totalPublic,
      },
    });
  } catch (error) {
    console.error('TG Share Stats Error:', error);
    res.status(500).json({ error: 'Failed to get share stats' });
  }
});

// POST /api/admin/videos/tg-share-fetch
// Fetches the next N eligible videos for sharing
router.post('/videos/tg-share-fetch', simpleAdminAuth, async (req, res) => {
  try {
    const { count = 50 } = req.body;
    const limit = Math.min(Math.max(parseInt(count) || 50, 1), 1000);

    const videos = await Video.find({
      status: 'public',
      isDuplicate: { $ne: true },
      sharedOnTG: { $ne: true },
    })
      .sort({ uploadDate: 1 })
      .limit(limit)
      .select('_id title slug thumbnail views duration uploadDate sharedOnTG');

    var backendUrl = getBackendUrl();

    const videosWithLinks = videos.map(function(v) {
      return {
        _id: v._id,
        title: v.title,
        slug: v.slug,
        thumbnail: v.thumbnail,
        views: v.views,
        duration: v.duration,
        uploadDate: v.uploadDate,
        shareUrl: backendUrl + '/api/public/share/' + v._id,
      };
    });

    res.json({
      success: true,
      videos: videosWithLinks,
      count: videosWithLinks.length,
    });
  } catch (error) {
    console.error('TG Share Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch videos for sharing' });
  }
});

// POST /api/admin/videos/tg-share-mark
// Marks videos as shared on Telegram
router.post('/videos/tg-share-mark', simpleAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No video IDs provided' });
    }

    const result = await Video.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          sharedOnTG: true,
          sharedOnTGDate: new Date(),
        },
      }
    );

    res.json({
      success: true,
      markedCount: result.modifiedCount,
      message: result.modifiedCount + ' videos marked as shared on Telegram',
    });
  } catch (error) {
    console.error('TG Share Mark Error:', error);
    res.status(500).json({ error: 'Failed to mark videos as shared' });
  }
});

// POST /api/admin/videos/tg-share-unmark
// Unmarks videos (reset shared status)
router.post('/videos/tg-share-unmark', simpleAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No video IDs provided' });
    }

    const result = await Video.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          sharedOnTG: false,
          sharedOnTGDate: null,
        },
      }
    );

    res.json({
      success: true,
      unmarkedCount: result.modifiedCount,
      message: result.modifiedCount + ' videos unmarked',
    });
  } catch (error) {
    console.error('TG Share Unmark Error:', error);
    res.status(500).json({ error: 'Failed to unmark videos' });
  }
});

// PUT /api/admin/videos/:id
router.put('/videos/:id', simpleAdminAuth, async (req, res) => {
  try {
    const { title, description, thumbnail, category, tags, status, featured, duration } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (thumbnail) video.thumbnail = thumbnail;
    if (category !== undefined) video.category = category || null;
    if (tags) video.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (status) video.status = status;
    if (featured !== undefined) video.featured = featured;
    if (duration) video.duration = duration;

    await video.save();
    res.json({ success: true, video, message: 'Video updated successfully' });
  } catch (error) {
    console.error('Update Video Error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// DELETE /api/admin/videos/:id
router.delete('/videos/:id', simpleAdminAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete Video Error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// POST /api/admin/videos/bulk-delete
router.post('/videos/bulk-delete', simpleAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No video IDs provided' });
    }
    const result = await Video.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deletedCount: result.deletedCount, message: `${result.deletedCount} videos deleted` });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete videos' });
  }
});

// PUT /api/admin/videos/:id/feature
router.put('/videos/:id/feature', simpleAdminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    video.featured = !video.featured;
    await video.save();
    res.json({ success: true, featured: video.featured, message: video.featured ? 'Video featured' : 'Video unfeatured' });
  } catch (error) {
    console.error('Toggle Feature Error:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// PUT /api/admin/videos/:id/status
router.put('/videos/:id/status', simpleAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['public', 'private', 'unlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const video = await Video.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, status: video.status, message: 'Video status updated' });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;