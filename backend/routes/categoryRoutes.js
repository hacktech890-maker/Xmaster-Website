const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Category = require('../models/Category');
const Video = require('../models/Video');

// Admin Auth Middleware
const simpleAdminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(401).json({ error: 'Invalid token' });
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    const query = all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ order: 1, name: 1 }).lean();

    // Get video counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Video.countDocuments({
          $or: [
            { category: cat._id },
            { categories: cat._id }
          ],
          status: 'public',
          isDuplicate: { $ne: true }
        });
        return {
          ...cat,
          videoCount: count,
        };
      })
    );

    res.json({ success: true, categories: categoriesWithCounts });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const videoCount = await Video.countDocuments({
      $or: [
        { category: category._id },
        { categories: category._id }
      ],
      status: 'public',
      isDuplicate: { $ne: true }
    });

    res.json({
      success: true,
      category: { ...category, videoCount }
    });
  } catch (error) {
    console.error('Get Category Error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// GET /api/categories/:slug/videos
router.get('/:slug/videos', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const videoQuery = {
      $or: [
        { category: category._id },
        { categories: category._id }
      ],
      status: 'public',
      isDuplicate: { $ne: true }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let videos;
    let total;

    if (sort === 'random') {
      total = await Video.countDocuments(videoQuery);
      videos = await Video.aggregate([
        { $match: videoQuery },
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
    } else {
      let sortOption = {};
      switch (sort) {
        case 'oldest': sortOption = { uploadDate: 1 }; break;
        case 'views': sortOption = { views: -1 }; break;
        default: sortOption = { uploadDate: -1 };
      }

      [videos, total] = await Promise.all([
        Video.find(videoQuery)
          .populate('category', 'name slug color icon')
          .populate('categories', 'name slug color icon')
          .sort(sortOption)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Video.countDocuments(videoQuery)
      ]);
    }

    res.json({
      success: true,
      category,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get Category Videos Error:', error);
    res.status(500).json({ error: 'Failed to get category videos' });
  }
});

// POST /api/categories (Admin - single)
router.post('/', simpleAdminAuth, async (req, res) => {
  try {
    const { name, description, thumbnail, icon, color, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = await Category.create({
      name,
      description: description || '',
      thumbnail: thumbnail || '',
      icon: icon || '📁',
      color: color || '#ef4444',
      type: type || 'category'
    });

    res.json({ success: true, category, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// POST /api/categories/bulk-create (Admin - bulk create)
router.post('/bulk-create', simpleAdminAuth, async (req, res) => {
  try {
    const { names, icon, color, type } = req.body;
    let nameList;
    if (typeof names === 'string') {
      nameList = names.split(',').map(n => n.trim()).filter(Boolean);
    } else if (Array.isArray(names)) {
      nameList = names.map(n => n.trim()).filter(Boolean);
    } else {
      return res.status(400).json({ error: 'Provide category names as comma-separated string or array' });
    }

    if (nameList.length === 0) {
      return res.status(400).json({ error: 'No category names provided' });
    }

    // Remove duplicates from input
    nameList = [...new Set(nameList)];

    const results = { created: [], skipped: [], failed: [] };

    for (const name of nameList) {
      try {
        const existing = await Category.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existing) {
          results.skipped.push({ name, reason: 'Already exists' });
          continue;
        }

        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const category = await Category.create({
          name,
          slug,
          description: '',
          icon: icon || '📁',
          color: color || '#ef4444',
          type: type || 'category',
          isActive: true,
        });

        results.created.push({ name: category.name, slug: category.slug, id: category._id });
      } catch (err) {
        results.failed.push({ name, error: err.message });
      }
    }

    const message = `${results.created.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed`;

    res.json({ success: true, message, results });
  } catch (error) {
    console.error('Bulk Create Categories Error:', error);
    res.status(500).json({ error: 'Failed to bulk create categories' });
  }
});

// PUT /api/categories/admin/reorder (Admin)
router.put('/admin/reorder', simpleAdminAuth, async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: 'Order array is required' });
    }

    for (let i = 0; i < order.length; i++) {
      await Category.findByIdAndUpdate(order[i], { order: i });
    }

    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    console.error('Reorder Error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// PUT /api/categories/:id (Admin)
router.put('/:id', simpleAdminAuth, async (req, res) => {
  try {
    const { name, description, thumbnail, icon, color, isActive, order, type } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (description !== undefined) category.description = description;
    if (thumbnail !== undefined) category.thumbnail = thumbnail;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;
    if (type) category.type = type;

    await category.save();
    res.json({ success: true, category, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id (Admin)
router.delete('/:id', simpleAdminAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Remove category reference from videos
    await Video.updateMany(
      { category: category._id },
      { $set: { category: null } }
    );
    await Video.updateMany(
      { categories: category._id },
      { $pull: { categories: category._id } }
    );

    await Category.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;