const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Category = require('../models/Category');
const ViewLog = require('../models/ViewLog');
const Report = require('../models/Report');

// GET /api/videos
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest', category = '', tag = '' } = req.query;
    const query = { status: 'public', isDuplicate: { $ne: true } };

    // Category filter - supports ObjectId
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.$or = [
          { category: new mongoose.Types.ObjectId(category) },
          { categories: new mongoose.Types.ObjectId(category) }
        ];
      }
    }
    if (tag) query.tags = { $in: [tag.toLowerCase()] };

    let sortOption = {};
    switch (sort) {
      case 'oldest': sortOption = { uploadDate: 1 }; break;
      case 'views': sortOption = { views: -1 }; break;
      case 'likes': sortOption = { likes: -1 }; break;
      default: sortOption = { uploadDate: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate('category', 'name slug color icon')
        .populate('categories', 'name slug color icon')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Video.countDocuments(query)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get Videos Error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

// GET /api/videos/latest
router.get('/latest', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const videos = await Video.find({ status: 'public', isDuplicate: { $ne: true } })
      .populate('category', 'name slug color icon')
      .populate('categories', 'name slug color icon')
      .sort({ uploadDate: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get Latest Error:', error);
    res.status(500).json({ error: 'Failed to get latest videos' });
  }
});

// GET /api/videos/trending
router.get('/trending', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    // Get top 50 by views, then randomly pick from them
    const videos = await Video.aggregate([
      { $match: { status: 'public', isDuplicate: { $ne: true } } },
      { $sort: { views: -1 } },
      { $limit: 50 },
      { $sample: { size: parseInt(limit) } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      { $project: { categoryData: 0 } }
    ]);
    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get Trending Error:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
});

// GET /api/videos/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const videos = await Video.find({
      status: 'public',
      featured: true,
      isDuplicate: { $ne: true }
    })
      .populate('category', 'name slug color icon')
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

// GET /api/videos/random - Truly random videos
router.get('/random', async (req, res) => {
  try {
    const { limit = 12, exclude = '' } = req.query;
    const excludeIds = exclude ? exclude.split(',').filter(Boolean) : [];

    const matchQuery = {
      status: 'public',
      isDuplicate: { $ne: true },
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
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      { $project: { categoryData: 0 } }
    ]);

    res.json({ success: true, videos });
  } catch (error) {
    console.error('Get Random Error:', error);
    res.status(500).json({ error: 'Failed to get random videos' });
  }
});

// GET /api/videos/:id
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      status: { $in: ['public', 'unlisted'] },
      isDuplicate: { $ne: true }
    })
      .populate('category', 'name slug color icon')
      .populate('categories', 'name slug color icon')
      .lean();

    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, video });
  } catch (error) {
    console.error('Get Video Error:', error);
    if (error.kind === 'ObjectId') return res.status(404).json({ error: 'Video not found' });
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// GET /api/videos/:id/related - SMART RANDOM RECOMMENDATIONS
// Uses seed parameter for different results on each refresh
router.get('/:id/related', async (req, res) => {
  try {
    const { limit = 12, seed = '' } = req.query;
    const video = await Video.findById(req.params.id).lean();
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const videoObjectId = new mongoose.Types.ObjectId(req.params.id);
    const requestedLimit = parseInt(limit);
    let relatedVideos = [];
    const baseMatch = {
      _id: { $ne: videoObjectId },
      status: 'public',
      isDuplicate: { $ne: true },
    };

    // STRATEGY 1: Same category videos (random, ~40%)
    if (video.category) {
      const categoryCount = Math.ceil(requestedLimit * 0.4);
      const catId = new mongoose.Types.ObjectId(video.category);
      const categoryVideos = await Video.aggregate([
        {
          $match: {
            ...baseMatch,
            $or: [
              { category: catId },
              { categories: catId }
            ]
          }
        },
        { $sample: { size: categoryCount + 5 } }, // fetch extra to account for overlaps
      ]);
      relatedVideos.push(...categoryVideos.slice(0, categoryCount));
    }

    // STRATEGY 2: Same tags videos (random, ~30%)
    if (video.tags && video.tags.length > 0) {
      const tagCount = Math.ceil(requestedLimit * 0.3);
      const existingIds = relatedVideos.map(v => v._id);
      const tagVideos = await Video.aggregate([
        {
          $match: {
            ...baseMatch,
            _id: { $ne: videoObjectId, $nin: existingIds },
            tags: { $in: video.tags },
          }
        },
        { $sample: { size: tagCount + 5 } },
      ]);
      relatedVideos.push(...tagVideos.slice(0, tagCount));
    }

    // STRATEGY 3: Fill remaining with random videos
    const remaining = requestedLimit - relatedVideos.length;
    if (remaining > 0) {
      const existingIds = [videoObjectId, ...relatedVideos.map(v => v._id)];
      const randomVideos = await Video.aggregate([
        {
          $match: {
            ...baseMatch,
            _id: { $nin: existingIds },
          }
        },
        { $sample: { size: remaining + 5 } },
      ]);
      relatedVideos.push(...randomVideos.slice(0, remaining));
    }

    // Deduplicate by _id
    const seenIds = new Set();
    relatedVideos = relatedVideos.filter(v => {
      const idStr = v._id.toString();
      if (seenIds.has(idStr)) return false;
      seenIds.add(idStr);
      return true;
    });

    // Shuffle using seed for consistent-per-request but different-per-refresh randomness
    const seedNum = seed ? parseInt(seed) || Date.now() : Date.now();
    let shuffleSeed = seedNum;
    const pseudoRandom = () => {
      shuffleSeed = (shuffleSeed * 16807 + 0) % 2147483647;
      return shuffleSeed / 2147483647;
    };

    for (let i = relatedVideos.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [relatedVideos[i], relatedVideos[j]] = [relatedVideos[j], relatedVideos[i]];
    }

    // Trim to requested limit
    relatedVideos = relatedVideos.slice(0, requestedLimit);

    // Populate category info
    const categoryIds = [...new Set(
      relatedVideos
        .map(v => v.category)
        .filter(Boolean)
        .map(c => c.toString())
    )];

    let categoriesMap = {};
    if (categoryIds.length > 0) {
      const cats = await Category.find({
        _id: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).select('name slug color icon').lean();
      cats.forEach(c => { categoriesMap[c._id.toString()] = c; });
    }

    relatedVideos = relatedVideos.map(v => ({
      ...v,
      category: v.category ? (categoriesMap[v.category.toString()] || v.category) : null,
    }));

    res.json({ success: true, videos: relatedVideos });
  } catch (error) {
    console.error('Get Related Error:', error);
    res.status(500).json({ error: 'Failed to get related videos' });
  }
});

// POST /api/videos/:id/view
router.post('/:id/view', async (req, res) => {
  try {
    const videoId = req.params.id;
    const ip = req.ip || req.connection.remoteAddress;

    const recentView = await ViewLog.findOne({ videoId, ip });
    if (recentView) {
      return res.json({ success: true, counted: false, message: 'View already counted' });
    }

    await ViewLog.create({ videoId, ip, userAgent: req.headers['user-agent'] || '' });
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    res.json({ success: true, counted: true, message: 'View counted' });
  } catch (error) {
    console.error('View Count Error:', error);
    res.status(500).json({ error: 'Failed to count view' });
  }
});

// POST /api/videos/:id/like
router.post('/:id/like', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, likes: video.likes });
  } catch (error) {
    console.error('Like Error:', error);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// POST /api/videos/:id/dislike
router.post('/:id/dislike', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { dislikes: 1 } }, { new: true });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ success: true, dislikes: video.dislikes });
  } catch (error) {
    console.error('Dislike Error:', error);
    res.status(500).json({ error: 'Failed to dislike video' });
  }
});

// POST /api/videos/:id/report
router.post('/:id/report', async (req, res) => {
  try {
    const { reason, description, email } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await Report.create({
      videoId: req.params.id,
      reason,
      description: description || '',
      email: email || '',
      ip: req.ip || ''
    });

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;