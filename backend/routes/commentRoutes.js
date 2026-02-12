const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');

// ==========================================
// ADMIN AUTH MIDDLEWARE
// ==========================================
const adminAuth = (req, res, next) => {
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

// ==========================================
// EMAIL VALIDATION
// ==========================================
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

// POST /api/comments - Submit a new comment/suggestion
router.post('/', async (req, res) => {
  try {
    const { name, email, reason, message, category } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g., example@gmail.com)' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason/Subject is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Comment/Suggestion is required' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters long' });
    }

    // Rate limiting - max 3 comments per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Comment.countDocuments({
      email: email.trim().toLowerCase(),
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= 3) {
      return res.status(429).json({ error: 'You have submitted too many comments. Please try again later.' });
    }

    const comment = await Comment.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      reason: reason.trim(),
      message: message.trim(),
      category: category || 'suggestion',
      isVisible: false,  // Hidden by default
      ip: req.ip || '',
    });

    console.log('✅ New comment submitted:', comment._id);

    res.status(201).json({
      success: true,
      message: 'Your comment has been submitted successfully! It will be visible after admin approval.',
    });
  } catch (error) {
    console.error('❌ Comment submit error:', error.message);
    res.status(500).json({ error: 'Failed to submit comment' });
  }
});

// GET /api/comments/public - Get all visible (approved) comments
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ isVisible: true })
        .select('-email -ip -adminNote -isRead')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Comment.countDocuments({ isVisible: true }),
    ]);

    res.json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get public comments error:', error.message);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET /api/comments/admin - Get all comments (admin)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, filter = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (filter === 'visible') query.isVisible = true;
    if (filter === 'hidden') query.isVisible = false;
    if (filter === 'unread') query.isRead = false;

    const [comments, total, unreadCount, visibleCount] = await Promise.all([
      Comment.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Comment.countDocuments(query),
      Comment.countDocuments({ isRead: false }),
      Comment.countDocuments({ isVisible: true }),
    ]);

    res.json({
      success: true,
      comments,
      stats: {
        total: await Comment.countDocuments(),
        unread: unreadCount,
        visible: visibleCount,
        hidden: await Comment.countDocuments({ isVisible: false }),
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Admin get comments error:', error.message);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// PUT /api/comments/:id/toggle-visibility - Toggle comment visibility
router.put('/:id/toggle-visibility', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.isVisible = !comment.isVisible;
    comment.isRead = true;
    await comment.save();

    res.json({
      success: true,
      isVisible: comment.isVisible,
      message: comment.isVisible ? 'Comment is now visible to public' : 'Comment is now hidden',
    });
  } catch (error) {
    console.error('❌ Toggle visibility error:', error.message);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

// PUT /api/comments/:id/read - Mark comment as read
router.put('/:id/read', adminAuth, async (req, res) => {
  try {
    await Comment.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PUT /api/comments/:id/note - Add admin note
router.put('/:id/note', adminAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { adminNote: note || '', isRead: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/comments/bulk-delete - Bulk delete comments
router.post('/bulk-delete', adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'No comment IDs provided' });
    }
    await Comment.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} comments deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comments' });
  }
});

module.exports = router;