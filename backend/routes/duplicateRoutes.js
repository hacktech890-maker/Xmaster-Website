const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Video = require("../models/Video");
const DuplicateDetector = require("../utils/duplicateDetector");

// Admin Auth Middleware
const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(401).json({ error: "Invalid token" });
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// ==========================================
// GET /api/duplicates - Get all duplicates grouped
// ==========================================
router.get("/", adminAuth, async (req, res) => {
  try {
    const { filter = "all", page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { isDuplicate: true };

    if (filter === "title") {
      query.duplicateReasons = { $in: ["title"] };
    } else if (filter === "duration") {
      query.duplicateReasons = { $in: ["duration"] };
    } else if (filter === "file") {
      query.duplicateReasons = { $in: ["file"] };
    }

    const [duplicates, total] = await Promise.all([
      Video.find(query)
        .populate("duplicateOf", "title thumbnail duration duration_seconds views status file_code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Video.countDocuments(query),
    ]);

    // Stats
    const [totalDuplicates, titleDups, durationDups, fileDups] = await Promise.all([
      Video.countDocuments({ isDuplicate: true }),
      Video.countDocuments({ isDuplicate: true, duplicateReasons: { $in: ["title"] } }),
      Video.countDocuments({ isDuplicate: true, duplicateReasons: { $in: ["duration"] } }),
      Video.countDocuments({ isDuplicate: true, duplicateReasons: { $in: ["file"] } }),
    ]);

    res.json({
      success: true,
      duplicates,
      stats: {
        total: totalDuplicates,
        byTitle: titleDups,
        byDuration: durationDups,
        byFile: fileDups,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Get duplicates error:", error.message);
    res.status(500).json({ error: "Failed to get duplicates" });
  }
});

// ==========================================
// POST /api/duplicates/scan - Run STRICT duplicate scan
// ==========================================
router.post("/scan", adminAuth, async (req, res) => {
  try {
    console.log("🔍 Admin triggered STRICT duplicate scan");
    const result = await DuplicateDetector.scanAllDuplicates();

    res.json({
      success: true,
      message: `Scan complete. Found ${result.duplicatesFound} duplicates out of ${result.totalScanned} videos.`,
      ...result,
    });
  } catch (error) {
    console.error("❌ Scan error:", error.message);
    res.status(500).json({ error: "Scan failed" });
  }
});

// ==========================================
// POST /api/duplicates/check - Check single video
// ==========================================
router.post("/check", adminAuth, async (req, res) => {
  try {
    const { title, duration_seconds, fileHash, file_code, excludeId } = req.body;

    const result = await DuplicateDetector.checkDuplicate(
      { title, duration_seconds, fileHash, file_code },
      excludeId
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: "Check failed" });
  }
});

// ==========================================
// PUT /api/duplicates/:id/keep - Unmark as duplicate, make public
// ==========================================
router.put("/:id/keep", adminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.isDuplicate = false;
    video.duplicateOf = null;
    video.duplicateReasons = [];
    video.status = "public";
    await video.save();

    res.json({ success: true, message: "Video marked as unique and made public" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ==========================================
// PUT /api/duplicates/:id/make-public - Make duplicate public
// ==========================================
router.put("/:id/make-public", adminAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        status: "public",
        isDuplicate: false,
        duplicateOf: null,
        duplicateReasons: [],
      },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json({ success: true, message: "Video is now public", video });
  } catch (error) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ==========================================
// POST /api/duplicates/publish-all - PUBLISH ALL DUPLICATES AT ONCE
// ==========================================
router.post("/publish-all", adminAuth, async (req, res) => {
  try {
    const { filter } = req.body; // Optional: only publish certain types

    let query = { isDuplicate: true };

    // Allow filtering by reason type
    if (filter === "title") {
      query.duplicateReasons = { $in: ["title"] };
    } else if (filter === "duration") {
      query.duplicateReasons = { $in: ["duration"] };
    } else if (filter === "file") {
      query.duplicateReasons = { $in: ["file"] };
    }

    const beforeCount = await Video.countDocuments(query);

    const result = await Video.updateMany(query, {
      $set: {
        isDuplicate: false,
        duplicateOf: null,
        duplicateReasons: [],
        status: "public",
      },
    });

    const afterShowing = await Video.countDocuments({
      status: "public",
      isDuplicate: { $ne: true },
    });

    console.log(`✅ Published ${result.modifiedCount} duplicate videos`);

    res.json({
      success: true,
      message: `Published ${result.modifiedCount} videos successfully`,
      published: result.modifiedCount,
      totalShowing: afterShowing,
    });
  } catch (error) {
    console.error("❌ Publish all error:", error.message);
    res.status(500).json({ error: "Failed to publish all" });
  }
});

// ==========================================
// DELETE /api/duplicates/:id - Delete a duplicate
// ==========================================
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (video.cloudinary_public_id) {
      try {
        const { deleteImage } = require("../config/cloudinary");
        await deleteImage(video.cloudinary_public_id);
      } catch (e) {
        console.error("⚠️ Cloudinary cleanup failed:", e.message);
      }
    }

    await Video.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Duplicate deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// ==========================================
// POST /api/duplicates/bulk-delete - Bulk delete duplicates
// ==========================================
router.post("/bulk-delete", adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const result = await Video.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `${result.deletedCount} duplicates deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// ==========================================
// POST /api/duplicates/bulk-publish - Bulk publish selected duplicates
// ==========================================
router.post("/bulk-publish", adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const result = await Video.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isDuplicate: false,
          duplicateOf: null,
          duplicateReasons: [],
          status: "public",
        },
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} videos published`,
      published: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish" });
  }
});

// ==========================================
// POST /api/duplicates/clear-all - Clear all duplicate flags
// ==========================================
router.post("/clear-all", adminAuth, async (req, res) => {
  try {
    const result = await Video.updateMany(
      { isDuplicate: true },
      {
        $set: {
          isDuplicate: false,
          duplicateOf: null,
          duplicateReasons: [],
          status: "public",
        },
      }
    );

    res.json({
      success: true,
      message: `Cleared duplicate flags from ${result.modifiedCount} videos and made them public`,
      cleared: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear" });
  }
});

module.exports = router;