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

function getFrontendUrl() {
  var raw = process.env.FRONTEND_URL || 'https://xmaster.guru';
  if (raw.indexOf(',') !== -1) {
    raw = raw.split(',')[0].trim();
  }
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

    const [totalVideos, publicVideos, totalViewsResult, totalCategories, totalAds, pendingReports, todayVideos, weekVideos] = await Promise.all([
      Video.countDocuments(),
      Video.countDocuments({ status: 'public' }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Category.countDocuments({ isActive: true }),
      Ad.countDocuments({ enabled: true }),
      Report.countDocuments({ status: 'pending' }),
      Video.countDocuments({ uploadDate: { $gte: today } }),
      Video.countDocuments({ uploadDate: { $gte: weekAgo } }),
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
    const { page = 1, limit = 20, search = '', status = '', featured = '', sort = 'newest' } = req.query;
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
// BULK UPDATE STATUS (Publish/Unpublish)
// MUST be BEFORE /videos/:id routes
// ==========================================
router.post('/videos/bulk-update-status', simpleAdminAuth, async (req, res) => {
  try {
    const { ids, status, mode } = req.body;

    if (!['public', 'private', 'unlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: public, private, unlisted' });
    }

    let result;

    if (mode === 'all-private') {
      result = await Video.updateMany(
        { status: 'private', isDuplicate: { $ne: true } },
        { $set: { status: status } }
      );
    } else if (mode === 'all-public') {
      result = await Video.updateMany(
        { status: 'public' },
        { $set: { status: status } }
      );
    } else {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No video IDs provided' });
      }
      result = await Video.updateMany(
        { _id: { $in: ids } },
        { $set: { status: status } }
      );
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: result.modifiedCount + ' videos updated to ' + status,
    });
  } catch (error) {
    console.error('Bulk Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update video status' });
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

// ==========================================
// BULK EDIT TITLES (Excel Paste Feature)
// ==========================================
router.post('/videos/bulk-update-titles', simpleAdminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    // updates = [{ id: "...", title: "..." }, ...]
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const update of updates) {
      try {
        if (!update.id || !update.title || !update.title.trim()) {
          results.failed++;
          results.errors.push({ id: update.id, error: 'Missing ID or title' });
          continue;
        }

        const video = await Video.findById(update.id);
        if (!video) {
          results.failed++;
          results.errors.push({ id: update.id, error: 'Video not found' });
          continue;
        }

        video.title = update.title.trim();
        // Regenerate slug from new title
        video.slug = video.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
          '-' +
          video.file_code.substring(0, 8);

        await video.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: update.id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.success} titles, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Bulk Update Titles Error:', error);
    res.status(500).json({ error: 'Failed to bulk update titles' });
  }
});

// ==========================================
// BULK ADD TAGS (Excel Paste Feature)
// ==========================================
router.post('/videos/bulk-update-tags', simpleAdminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    // updates = [{ id: "...", tags: ["tag1", "tag2"] }, ...]
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const update of updates) {
      try {
        if (!update.id) {
          results.failed++;
          results.errors.push({ id: update.id, error: 'Missing ID' });
          continue;
        }

        const tags = Array.isArray(update.tags)
          ? update.tags.map(t => t.trim().toLowerCase()).filter(Boolean)
          : (update.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

        if (tags.length === 0) {
          results.failed++;
          results.errors.push({ id: update.id, error: 'No valid tags' });
          continue;
        }

        const mode = update.mode || 'append'; // append or replace

        if (mode === 'replace') {
          await Video.findByIdAndUpdate(update.id, { $set: { tags: tags } });
        } else {
          await Video.findByIdAndUpdate(update.id, { $addToSet: { tags: { $each: tags } } });
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: update.id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Updated tags for ${results.success} videos, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Bulk Update Tags Error:', error);
    res.status(500).json({ error: 'Failed to bulk update tags' });
  }
});

// ==========================================
// BULK SELECT & GET SHARE LINKS
// ==========================================
router.post('/videos/bulk-share-links', simpleAdminAuth, async (req, res) => {
  try {
    const { ids, count, mode } = req.body;
    // mode: 'selected' (use ids array) or 'first' (use count number)

    let videos;
    var frontendUrl = getFrontendUrl();

    if (mode === 'first' && count) {
      videos = await Video.find({
        status: 'public',
        isDuplicate: { $ne: true },
      })
        .sort({ uploadDate: -1 })
        .limit(Math.min(parseInt(count) || 50, 5000))
        .select('_id title slug views duration uploadDate tags')
        .lean();
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      videos = await Video.find({ _id: { $in: ids } })
        .select('_id title slug views duration uploadDate tags')
        .lean();
    } else {
      return res.status(400).json({ error: 'Provide ids array or count number' });
    }

    const videosWithLinks = videos.map(function (v) {
      var videoUrl = frontendUrl + '/watch/' + v._id;
      if (v.slug) {
        videoUrl += '/' + encodeURIComponent(v.slug);
      }
      return {
        _id: v._id,
        title: v.title,
        slug: v.slug,
        shareUrl: videoUrl,
        views: v.views,
        duration: v.duration,
        uploadDate: v.uploadDate,
        tags: v.tags || [],
      };
    });

    res.json({
      success: true,
      videos: videosWithLinks,
      count: videosWithLinks.length,
    });
  } catch (error) {
    console.error('Bulk Share Links Error:', error);
    res.status(500).json({ error: 'Failed to generate share links' });
  }
});

// ==========================================
// EXPORT VIDEO METADATA (JSON for frontend to convert to CSV/Excel)
// ==========================================
router.get('/videos/export', simpleAdminAuth, async (req, res) => {
  try {
    const { ids, format = 'json', limit = 5000 } = req.query;
    var frontendUrl = getFrontendUrl();

    let query = { status: 'public', isDuplicate: { $ne: true } };

    // If specific IDs provided
    if (ids) {
      const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
      if (idArray.length > 0) {
        query = { _id: { $in: idArray } };
      }
    }

    const videos = await Video.find(query)
      .sort({ uploadDate: -1 })
      .limit(Math.min(parseInt(limit) || 5000, 10000))
      .select('_id title slug tags views duration uploadDate file_code category')
      .populate('category', 'name')
      .lean();

    const exportData = videos.map(function (v) {
      var videoUrl = frontendUrl + '/watch/' + v._id;
      if (v.slug) {
        videoUrl += '/' + encodeURIComponent(v.slug);
      }
      return {
        id: v._id,
        title: v.title,
        shareUrl: videoUrl,
        tags: (v.tags || []).join(', '),
        views: v.views || 0,
        duration: v.duration || '00:00',
        category: v.category?.name || 'General',
        fileCode: v.file_code,
        uploadDate: v.uploadDate ? new Date(v.uploadDate).toISOString().split('T')[0] : '',
      };
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Title', 'Share URL', 'Tags', 'Views', 'Duration', 'Category', 'File Code', 'Upload Date'];
      let csv = headers.join(',') + '\n';

      exportData.forEach(function (row) {
        csv += [
          row.id,
          '"' + (row.title || '').replace(/"/g, '""') + '"',
          row.shareUrl,
          '"' + (row.tags || '').replace(/"/g, '""') + '"',
          row.views,
          row.duration,
          '"' + (row.category || '').replace(/"/g, '""') + '"',
          row.fileCode,
          row.uploadDate,
        ].join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=xmaster-videos-export.csv');
      return res.status(200).send(csv);
    }

    // Default: JSON
    res.json({
      success: true,
      videos: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Failed to export video metadata' });
  }
});

module.exports = router;