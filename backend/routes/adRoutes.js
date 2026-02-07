const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Ad = require('../models/Ad');

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

// ==========================================
// PUBLIC ROUTES
// ==========================================

// GET /api/ads - Get all active ads grouped by placement
router.get('/', async (req, res) => {
  try {
    const { device = 'desktop' } = req.query;
    const ads = await Ad.find({
      enabled: true,
      $or: [{ device: 'all' }, { device: device }]
    }).sort({ priority: -1, placement: 1 });

    const adsByPlacement = {};
    ads.forEach(ad => {
      if (!adsByPlacement[ad.placement]) {
        adsByPlacement[ad.placement] = [];
      }
      adsByPlacement[ad.placement].push(ad);
    });

    res.json({ success: true, ads: adsByPlacement });
  } catch (error) {
    console.error('Get Ads Error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// GET /api/ads/placement/:placement - Get ad by placement (THIS WAS MISSING!)
router.get('/placement/:placement', async (req, res) => {
  try {
    const { device = 'desktop' } = req.query;
    const placement = req.params.placement;

    console.log(`📢 Fetching ad for placement: ${placement}, device: ${device}`);

    const ad = await Ad.findOne({
      placement: placement,
      enabled: true,
      $or: [{ device: 'all' }, { device: device }]
    }).sort({ priority: -1 });

    // Return null if no ad found (not an error)
    res.json({ success: true, ad: ad || null });
  } catch (error) {
    console.error('Get Ad by Placement Error:', error);
    res.status(500).json({ error: 'Failed to get ad' });
  }
});

// POST /api/ads/:id/impression - Record ad impression
router.post('/:id/impression', async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record impression' });
  }
});

// POST /api/ads/:id/click - Record ad click
router.post('/:id/click', async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET /api/ads/admin/all - Get all ads (admin)
router.get('/admin/all', simpleAdminAuth, async (req, res) => {
  try {
    const ads = await Ad.find().sort({ placement: 1, priority: -1 });
    res.json({ success: true, ads });
  } catch (error) {
    console.error('Get All Ads Error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// GET /api/ads/admin/placements - Get available placements
router.get('/admin/placements', simpleAdminAuth, (req, res) => {
  const placements = [
    { id: 'home_top', name: 'Home - Top Banner', size: '728x90' },
    { id: 'home_sidebar', name: 'Home - Sidebar', size: '300x600' },
    { id: 'home_infeed', name: 'Home - In-Feed', size: 'Native' },
    { id: 'home_footer', name: 'Home - Footer', size: '728x90' },
    { id: 'watch_sidebar', name: 'Watch - Sidebar', size: '300x250' },
    { id: 'watch_below', name: 'Watch - Below Player', size: '728x90' },
    { id: 'watch_related', name: 'Watch - Related Videos', size: 'Native' },
    { id: 'watch_overlay', name: 'Watch - Video Overlay', size: '480x70' },
    { id: 'search_top', name: 'Search - Top', size: '728x90' },
    { id: 'category_top', name: 'Category - Top', size: '728x90' },
    { id: 'popunder', name: 'Popunder', size: 'Full Page' },
    { id: 'interstitial', name: 'Interstitial', size: 'Full Page' }
  ];
  res.json({ success: true, placements });
});

// POST /api/ads - Create new ad
router.post('/', simpleAdminAuth, async (req, res) => {
  try {
    const { name, placement, type, code, imageUrl, targetUrl, device, enabled, priority } = req.body;

    if (!name || !placement || !code) {
      return res.status(400).json({ error: 'Name, placement, and code are required' });
    }

    const ad = await Ad.create({
      name,
      placement,
      type: type || 'script',
      code,
      imageUrl: imageUrl || '',
      targetUrl: targetUrl || '',
      device: device || 'all',
      enabled: enabled !== false,
      priority: priority || 0
    });

    res.json({ success: true, ad, message: 'Ad created successfully' });
  } catch (error) {
    console.error('Create Ad Error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// PUT /api/ads/:id - Update ad
router.put('/:id', simpleAdminAuth, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const updateFields = ['name', 'placement', 'type', 'code', 'imageUrl', 'targetUrl', 'device', 'enabled', 'priority'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        ad[field] = req.body[field];
      }
    });

    await ad.save();
    res.json({ success: true, ad, message: 'Ad updated successfully' });
  } catch (error) {
    console.error('Update Ad Error:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// DELETE /api/ads/:id - Delete ad
router.delete('/:id', simpleAdminAuth, async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete Ad Error:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// PUT /api/ads/:id/toggle - Toggle ad enabled status
router.put('/:id/toggle', simpleAdminAuth, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    ad.enabled = !ad.enabled;
    await ad.save();

    res.json({
      success: true,
      enabled: ad.enabled,
      message: ad.enabled ? 'Ad enabled' : 'Ad disabled'
    });
  } catch (error) {
    console.error('Toggle Ad Error:', error);
    res.status(500).json({ error: 'Failed to toggle ad' });
  }
});

module.exports = router;