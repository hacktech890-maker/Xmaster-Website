const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Category = require('../models/Category');
const ViewLog = require('../models/ViewLog');
const Report = require('../models/Report');

// ============================================================
// GET /api/videos
// Public route — EXCLUDES premium videos
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { sort = 'newest', category = '', tag = '' } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(parseInt(req.query.limit) || 40, 100);

    // Public route: never serve premium videos
    const query = {
      status: 'public',
      isDuplicate: { $ne: true },
      isPremium: { $ne: true },
    };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        const catId = new mongoose.Types.ObjectId(category);
        query.$or = [{ category: catId }, { categories: catId }];
      }
    }
    if (tag) query.tags = { $in: [tag.toLowerCase()] };

    const total      = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    if (sort === 'random') {
      const excludeStr = req.query.exclude || '';
      const excludeIds = excludeStr
        ? excludeStr.split(',').map(id => id.trim())
            .filter(id => id && mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id))
        : [];

      const randomQuery = { ...query };
      if (excludeIds.length > 0) {
        randomQuery._id = { $nin: excludeIds };
      }

      const videos = await Video.aggregate([
        { $match: randomQuery },
        { $sample: { size: limit } },
        {
          $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryData' }
        },
        { $addFields: { category: { $arrayElemAt: ['$categoryData', 0] } } },
        { $project: { categoryData: 0 } }
      ]);

      return res.json({ success: true, videos, totalPages: 1, total, page: 1, pagination: { page: 1, limit, total, pages: 1 } });
    }

    if (page > totalPages) {
      return res.json({ success: true, videos: [], totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
    }

    let sortOption = {};
    switch (sort) {
      case 'oldest': sortOption = { uploadDate:  1 };       break;
      case 'views':  sortOption = { views: -1, _id: -1 };  break;
      case 'likes':  sortOption = { likes: -1, _id: -1 };  break;
      default:       sortOption = { uploadDate: -1, _id: -1 };
    }

    const skip   = (page - 1) * limit;
    const videos = await Video.find(query)
      .populate('category',   'name slug color icon')
      .populate('categories', 'name slug color icon')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, videos, totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
  } catch (error) {
    console.error('Get Videos Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get videos', message: error.message });
  }
});

// ============================================================
// GET /api/videos/premium
// Premium-only route — returns ONLY isPremium:true videos
// Supports: sort, page, limit, category filter
// ============================================================
router.get('/premium', async (req, res) => {
  try {
    const { sort = 'newest', category = '', tag = '' } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(parseInt(req.query.limit) || 40, 100);

    const query = {
      status:      'public',
      isDuplicate: { $ne: true },
      isPremium:   true,
    };

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        const catId = new mongoose.Types.ObjectId(category);
        query.$or = [{ category: catId }, { categories: catId }];
      }
    }
    if (tag) query.tags = { $in: [tag.toLowerCase()] };

    const total      = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    if (sort === 'random') {
      const videos = await Video.aggregate([
        { $match: query },
        { $sample: { size: limit } },
        {
          $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryData' }
        },
        { $addFields: { category: { $arrayElemAt: ['$categoryData', 0] } } },
        { $project: { categoryData: 0 } }
      ]);
      return res.json({ success: true, videos, totalPages: 1, total, page: 1, pagination: { page: 1, limit, total, pages: 1 } });
    }

    if (page > totalPages) {
      return res.json({ success: true, videos: [], totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
    }

    let sortOption = {};
    switch (sort) {
      case 'oldest': sortOption = { uploadDate:  1 };       break;
      case 'views':  sortOption = { views: -1, _id: -1 };  break;
      case 'likes':  sortOption = { likes: -1, _id: -1 };  break;
      default:       sortOption = { uploadDate: -1, _id: -1 };
    }

    const skip   = (page - 1) * limit;
    const videos = await Video.find(query)
      .populate('category',   'name slug color icon isPremium')
      .populate('categories', 'name slug color icon isPremium')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, videos, totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
  } catch (error) {
    console.error('Get Premium Videos Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get premium videos', message: error.message });
  }
});

// ============================================================
// GET /api/videos/latest — public only
// ============================================================
router.get('/latest', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);

    const query = { status: 'public', isDuplicate: { $ne: true }, isPremium: { $ne: true } };

    const total      = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip       = (page - 1) * limit;

    const videos = await Video.find(query)
      .populate('category',   'name slug color icon')
      .populate('categories', 'name slug color icon')
      .sort({ uploadDate: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, videos, totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
  } catch (error) {
    console.error('Get Latest Error:', error);
    res.status(500).json({ error: 'Failed to get latest videos' });
  }
});

// ============================================================
// GET /api/videos/trending — public only
// ============================================================
router.get('/trending', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(parseInt(req.query.limit) || 12, 100);
    const period = req.query.period || '7d';

    const query = { status: 'public', isDuplicate: { $ne: true }, isPremium: { $ne: true } };

    if (period && period !== 'all') {
      const periodMap = { '24h': 1, '7d': 7, '30d': 30 };
      const days = periodMap[period];
      if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        query.uploadDate = { $gte: since };
      }
    }

    const total      = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip       = (page - 1) * limit;

    const videos = await Video.find(query)
      .populate('category',   'name slug color icon')
      .populate('categories', 'name slug color icon')
      .sort({ views: -1, uploadDate: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, videos, totalPages, total, page, pagination: { page, limit, total, pages: totalPages } });
  } catch (error) {
    console.error('Get Trending Error:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
});

// ============================================================
// GET /api/videos/featured — public only
// ============================================================
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const videos = await Video.find({
      status:      'public',
      featured:    true,
      isDuplicate: { $ne: true },
      isPremium:   { $ne: true },
    })
      .populate('category',   'name slug color icon')
      .populate('categories', 'name slug color icon')
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get Featured Error:', error);
    res.status(500).json({ error: 'Failed to get featured videos' });
  }
});

// ============================================================
// GET /api/videos/random — public only
// ============================================================
router.get('/random', async (req, res) => {
  try {
    const { limit = 12, exclude = '' } = req.query;
    const excludeIds = exclude ? exclude.split(',').filter(Boolean) : [];

    const matchQuery = {
      status:      'public',
      isDuplicate: { $ne: true },
      isPremium:   { $ne: true },
    };

    if (excludeIds.length > 0) {
      matchQuery._id = {
        $nin: excludeIds.map(id => {
          try { return new mongoose.Types.ObjectId(id); }
          catch (e) { return null; }
        }).filter(Boolean)
      };
    }

    const videos = await Video.aggregate([
      { $match: matchQuery },
      { $sample: { size: parseInt(limit) } },
      {
        $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryData' }
      },
      { $addFields: { category: { $arrayElemAt: ['$categoryData', 0] } } },
      { $project: { categoryData: 0 } }
    ]);

    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get Random Error:', error);
    res.status(500).json({ error: 'Failed to get random videos' });
  }
});

// ============================================================
// GET /api/videos/:id
// Works for both public and premium videos
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({
      _id:    req.params.id,
      status: { $in: ['public', 'unlisted'] },
      isDuplicate: { $ne: true }
    })
      .populate('category',   'name slug color icon isPremium')
      .populate('categories', 'name slug color icon isPremium')
      .lean();

    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, video });
  } catch (error) {
    console.error('Get Video Error:', error);
    if (error.kind === 'ObjectId') return res.status(404).json({ error: 'Video not found' });
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// ============================================================
// GET /api/videos/:id/related
// Related for premium videos only returns other premium videos
// Related for public videos only returns public videos
// ============================================================
router.get('/:id/related', async (req, res) => {
  try {
    const { limit = 12, seed = '' } = req.query;

    const video = await Video.findById(req.params.id).lean();
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const videoObjectId  = new mongoose.Types.ObjectId(req.params.id);
    const requestedLimit = parseInt(limit);
    let relatedVideos    = [];

    // Related pool must match the same premium status as the source video
    const baseMatch = {
      _id:         { $ne: videoObjectId },
      status:      'public',
      isDuplicate: { $ne: true },
      isPremium:   video.isPremium ? true : { $ne: true },
    };

    let categoryObjectId = null;
    if (video.category) {
      const catStr = video.category.toString();
      if (mongoose.Types.ObjectId.isValid(catStr)) {
        categoryObjectId = new mongoose.Types.ObjectId(catStr);
      }
    }

    if (categoryObjectId) {
      const categoryCount  = Math.ceil(requestedLimit * 0.4);
      const categoryVideos = await Video.aggregate([
        { $match: { ...baseMatch, $or: [{ category: categoryObjectId }, { categories: categoryObjectId }] } },
        { $sample: { size: categoryCount + 5 } },
      ]);
      relatedVideos.push(...categoryVideos.slice(0, categoryCount));
    }

    if (video.tags && video.tags.length > 0) {
      const tagCount    = Math.ceil(requestedLimit * 0.3);
      const existingIds = relatedVideos.map((v) => v._id);
      const tagVideos   = await Video.aggregate([
        { $match: { ...baseMatch, _id: { $ne: videoObjectId, $nin: existingIds }, tags: { $in: video.tags } } },
        { $sample: { size: tagCount + 5 } },
      ]);
      relatedVideos.push(...tagVideos.slice(0, tagCount));
    }

    const remaining = requestedLimit - relatedVideos.length;
    if (remaining > 0) {
      const existingIds  = [videoObjectId, ...relatedVideos.map((v) => v._id)];
      const randomVideos = await Video.aggregate([
        { $match: { ...baseMatch, _id: { $nin: existingIds } } },
        { $sample: { size: remaining + 5 } },
      ]);
      relatedVideos.push(...randomVideos.slice(0, remaining));
    }

    // Deduplicate
    const seenIds = new Set();
    relatedVideos = relatedVideos.filter((v) => {
      const idStr = v._id.toString();
      if (seenIds.has(idStr)) return false;
      seenIds.add(idStr);
      return true;
    });

    // Shuffle
    const seedNum      = seed ? parseInt(seed) || Date.now() : Date.now();
    let shuffleSeed    = seedNum;
    const pseudoRandom = () => { shuffleSeed = (shuffleSeed * 16807 + 0) % 2147483647; return shuffleSeed / 2147483647; };
    for (let i = relatedVideos.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [relatedVideos[i], relatedVideos[j]] = [relatedVideos[j], relatedVideos[i]];
    }
    relatedVideos = relatedVideos.slice(0, requestedLimit);

    // Populate categories
    const categoryIds = [...new Set(relatedVideos.map((v) => v.category).filter(Boolean).map((c) => c.toString()))];
    let categoriesMap = {};
    if (categoryIds.length > 0) {
      const validCatIds = categoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
      if (validCatIds.length > 0) {
        const cats = await Category.find({ _id: { $in: validCatIds } }).select('name slug color icon isPremium').lean();
        cats.forEach((c) => { categoriesMap[c._id.toString()] = c; });
      }
    }
    relatedVideos = relatedVideos.map((v) => ({ ...v, category: v.category ? categoriesMap[v.category.toString()] || null : null }));

    res.json({ success: true, videos: relatedVideos });
  } catch (error) {
    console.error('Get Related Error:', error.message);
    res.status(500).json({ error: 'Failed to get related videos', message: error.message });
  }
});

// ============================================================
// POST /api/videos/:id/view
// ============================================================
router.post('/:id/view', async (req, res) => {
  try {
    const videoId = req.params.id;
    const ip      = req.ip || req.connection.remoteAddress;

    const recentView = await ViewLog.findOne({ videoId, ip });
    if (recentView) return res.json({ success: true, counted: false, message: 'View already counted' });

    await ViewLog.create({ videoId, ip, userAgent: req.headers['user-agent'] || '' });
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    res.json({ success: true, counted: true, message: 'View counted' });
  } catch (error) {
    console.error('View Count Error:', error);
    res.status(500).json({ error: 'Failed to count view' });
  }
});

// ============================================================
// POST /api/videos/:id/like
// ============================================================
router.post('/:id/like', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, likes: video.likes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// ============================================================
// POST /api/videos/:id/dislike
// ============================================================
router.post('/:id/dislike', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { dislikes: 1 } }, { new: true });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, dislikes: video.dislikes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dislike video' });
  }
});

// ============================================================
// POST /api/videos/:id/report
// ============================================================
router.post('/:id/report', async (req, res) => {
  try {
    const { reason, description, email } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await Report.create({ videoId: req.params.id, reason, description: description || '', email: email || '', ip: req.ip || '' });
    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;