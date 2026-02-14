const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const mongoose = require("mongoose");

const abyssService = require("../abyssService");
const Video = require("../models/Video");
const Category = require("../models/Category");
const DuplicateDetector = require("../utils/duplicateDetector");
const { extractThumbnail, getVideoMetadata, cleanupThumbnail } = require("../utils/videoProcessor");
const { uploadImage, deleteImage } = require("../config/cloudinary");

// ============================================
// DISK STORAGE for large files
// ============================================
const uploadDir = path.join(os.tmpdir(), "xmaster-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "video/mp4", "video/mpeg", "video/quicktime",
    "video/x-msvideo", "video/x-matroska", "video/webm",
    "video/x-flv", "video/3gpp", "application/octet-stream",
  ];

  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp4|mkv|avi|mov|webm|flv|3gp)$/i)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
});

const cleanupFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🧹 Cleaned up:", path.basename(filePath));
    }
  } catch (err) {
    console.error("⚠️ Cleanup error:", err.message);
  }
};

// Helper: resolve category to ObjectId
async function resolveCategory(categoryInput) {
  if (!categoryInput || categoryInput === '' || categoryInput === 'null') return null;

  // If it's already a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    const exists = await Category.findById(categoryInput);
    if (exists) return exists._id;
  }

  // If it's a string name, find or create category
  const existing = await Category.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${categoryInput}$`, 'i') } },
      { slug: categoryInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
    ]
  });

  if (existing) return existing._id;

  // Don't auto-create; just return null
  return null;
}

/**
 * POST /api/upload/single
 */
router.post("/single", upload.single("video"), async (req, res) => {
  let videoTempPath = null;
  let thumbnailTempPath = null;

  try {
    console.log("═══════════════════════════════════════");
    console.log("📤 Upload request received");
    console.log("═══════════════════════════════════════");

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video file uploaded" });
    }

    videoTempPath = req.file.path;
    const { title, description, category, categories, status, tags } = req.body;

    if (!title || title.trim() === "") {
      cleanupFile(videoTempPath);
      return res.status(400).json({ success: false, error: "Title is required" });
    }

    // Resolve category
    const categoryId = await resolveCategory(category);

    // Resolve multiple categories
    let categoryIds = [];
    if (categories) {
      const catArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
      for (const catId of catArray) {
        const resolved = await resolveCategory(catId);
        if (resolved) categoryIds.push(resolved);
      }
    }
    if (categoryId && !categoryIds.find(c => c.toString() === categoryId.toString())) {
      categoryIds.unshift(categoryId);
    }

    const safeStatus = ["public", "private", "unlisted"].includes(status) ? status : "public";

    console.log("📊 Upload details:", {
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      title: title.trim(),
      category: categoryId,
    });

    // STEP 1: Extract video metadata
    console.log("⏱️ Extracting video metadata...");
    const metadata = await getVideoMetadata(videoTempPath);
    const durationFormatted = metadata.durationFormatted || "00:00";
    console.log("✅ Duration:", durationFormatted);

    // STEP 2: Extract thumbnail
    console.log("📸 Extracting thumbnail...");
    thumbnailTempPath = await extractThumbnail(videoTempPath);

    let cloudinaryUrl = "";
    let cloudinaryPublicId = "";

    if (thumbnailTempPath) {
      console.log("☁️ Uploading thumbnail to Cloudinary...");
      const cloudResult = await uploadImage(thumbnailTempPath, "xmaster-thumbnails");
      cloudinaryUrl = cloudResult.url;
      cloudinaryPublicId = cloudResult.publicId;
      console.log("✅ Cloudinary URL:", cloudinaryUrl);
      cleanupThumbnail(thumbnailTempPath);
      thumbnailTempPath = null;
    }

    // STEP 3: Upload to Abyss.to
    console.log("📤 Uploading video to Abyss.to...");
    const abyssData = await abyssService.uploadVideoFromPath(videoTempPath, req.file.originalname);
    console.log("✅ Abyss upload complete:", { slug: abyssData.slug, embedUrl: abyssData.embedUrl });

    cleanupFile(videoTempPath);
    videoTempPath = null;

    const finalFileCode = abyssData.filecode || abyssData.slug;
    const finalEmbedUrl = abyssData.embedUrl || `https://short.icu/${finalFileCode}`;

    if (!finalFileCode) throw new Error("Abyss upload succeeded but filecode/slug is missing");

    const finalThumbnail = cloudinaryUrl || `https://abyss.to/splash/${finalFileCode}.jpg`;

    // Check exact duplicate
    const existing = await Video.findOne({ file_code: finalFileCode });
    if (existing) {
      if (cloudinaryPublicId) await deleteImage(cloudinaryPublicId);
      return res.status(409).json({
        success: false,
        error: "This video has already been uploaded",
        video: existing,
      });
    }

    // Duplicate detection
    const durationParts = durationFormatted.split(":").map(Number);
    let durationSeconds = 0;
    if (durationParts.length === 3) durationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
    else if (durationParts.length === 2) durationSeconds = durationParts[0] * 60 + durationParts[1];

    const dupCheck = await DuplicateDetector.checkDuplicate({
      title: title.trim(),
      duration_seconds: durationSeconds,
      file_code: finalFileCode,
    });

    const finalStatus = dupCheck.isDuplicate ? "private" : safeStatus;

    // Parse tags
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : tags;
    }

    // STEP 4: Save to MongoDB
    const newVideo = new Video({
      title: title.trim(),
      description: description?.trim() || "",
      file_code: finalFileCode,
      embed_code: finalEmbedUrl,
      thumbnail: finalThumbnail,
      cloudinary_public_id: cloudinaryPublicId || "",
      duration: durationFormatted,
      views: 0,
      category: categoryId,
      categories: categoryIds,
      tags: parsedTags,
      status: finalStatus,
      isDuplicate: dupCheck.isDuplicate,
      duplicateOf: dupCheck.duplicateOf,
      duplicateReasons: dupCheck.reasons,
      uploadDate: new Date(),
    });

    await newVideo.save();
    console.log("✅ Video saved to DB:", { id: newVideo._id, file_code: newVideo.file_code });

    return res.status(201).json({
      success: true,
      message: dupCheck.isDuplicate ? "Video uploaded but marked as duplicate" : "Video uploaded successfully",
      video: newVideo,
      duplicate: dupCheck.isDuplicate ? { reasons: dupCheck.reasons, matches: dupCheck.matches } : null,
    });
  } catch (error) {
    if (videoTempPath) cleanupFile(videoTempPath);
    if (thumbnailTempPath) cleanupThumbnail(thumbnailTempPath);
    console.error("❌ Upload error:", error.message);
    return res.status(500).json({ success: false, error: "Upload failed", message: error.message });
  }
});

/**
 * POST /api/upload/file-code
 */
router.post("/file-code", async (req, res) => {
  try {
    const { file_code, title, category, categories, status, tags } = req.body;

    if (!file_code?.trim()) {
      return res.status(400).json({ success: false, error: "File code is required" });
    }

    const cleanCode = file_code.trim();
    const existing = await Video.findOne({ file_code: cleanCode });
    if (existing) {
      return res.status(409).json({ success: false, error: "Video already exists", video: existing });
    }

    const videoTitle = title?.trim() || cleanCode;
    const categoryId = await resolveCategory(category);

    let categoryIds = [];
    if (categories) {
      const catArray = typeof categories === 'string' ? JSON.parse(categories) : (Array.isArray(categories) ? categories : []);
      for (const catId of catArray) {
        const resolved = await resolveCategory(catId);
        if (resolved) categoryIds.push(resolved);
      }
    }
    if (categoryId && !categoryIds.find(c => c.toString() === categoryId.toString())) {
      categoryIds.unshift(categoryId);
    }

    const dupCheck = await DuplicateDetector.checkDuplicate({
      title: videoTitle,
      duration_seconds: 0,
      file_code: cleanCode,
    });

    const finalStatus = dupCheck.isDuplicate ? "private" : (status || "public");

    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    const newVideo = new Video({
      title: videoTitle,
      file_code: cleanCode,
      embed_code: `https://short.icu/${cleanCode}`,
      thumbnail: `https://abyss.to/splash/${cleanCode}.jpg`,
      duration: "00:00",
      views: 0,
      category: categoryId,
      categories: categoryIds,
      status: finalStatus,
      tags: parsedTags,
      isDuplicate: dupCheck.isDuplicate,
      duplicateOf: dupCheck.duplicateOf,
      duplicateReasons: dupCheck.reasons,
      uploadDate: new Date(),
    });

    await newVideo.save();

    return res.status(201).json({
      success: true,
      message: dupCheck.isDuplicate ? "Video added but marked as duplicate" : "Video added successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("❌ File code error:", error.message);
    return res.status(500).json({ success: false, error: "Failed to add video", message: error.message });
  }
});

/**
 * POST /api/upload/bulk-file-codes
 */
router.post("/bulk-file-codes", async (req, res) => {
  try {
    const { videos } = req.body;
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ success: false, error: "No videos provided" });
    }

    const results = { success: [], failed: [], duplicates: [] };

    for (const videoData of videos) {
      try {
        const cleanCode = videoData.file_code?.trim();
        if (!cleanCode) {
          results.failed.push({ file_code: videoData.file_code, error: "Empty file code" });
          continue;
        }

        const existing = await Video.findOne({ file_code: cleanCode });
        if (existing) {
          results.failed.push({ file_code: cleanCode, error: "Already exists" });
          continue;
        }

        const videoTitle = videoData.title?.trim() || cleanCode;
        const categoryId = await resolveCategory(videoData.category);

        const dupCheck = await DuplicateDetector.checkDuplicate({
          title: videoTitle,
          duration_seconds: 0,
          file_code: cleanCode,
        });

        const finalStatus = dupCheck.isDuplicate ? "private" : (videoData.status || "public");

        const newVideo = new Video({
          title: videoTitle,
          file_code: cleanCode,
          embed_code: `https://short.icu/${cleanCode}`,
          thumbnail: `https://abyss.to/splash/${cleanCode}.jpg`,
          duration: "00:00",
          views: 0,
          category: categoryId,
          categories: categoryId ? [categoryId] : [],
          status: finalStatus,
          tags: videoData.tags || [],
          isDuplicate: dupCheck.isDuplicate,
          duplicateOf: dupCheck.duplicateOf,
          duplicateReasons: dupCheck.reasons,
          uploadDate: new Date(),
        });

        await newVideo.save();

        if (dupCheck.isDuplicate) {
          results.duplicates.push({ file_code: cleanCode, id: newVideo._id, title: newVideo.title, reasons: dupCheck.reasons });
        } else {
          results.success.push({ file_code: cleanCode, id: newVideo._id, title: newVideo.title });
        }
      } catch (err) {
        results.failed.push({ file_code: videoData.file_code, error: err.message });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("❌ Bulk error:", error.message);
    return res.status(500).json({ success: false, error: "Bulk add failed", message: error.message });
  }
});

/**
 * POST /api/upload/thumbnail
 */
router.post("/thumbnail", upload.single("thumbnail"), async (req, res) => {
  let tempPath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No image file uploaded" });
    tempPath = req.file.path;
    const cloudResult = await uploadImage(tempPath, "xmaster-thumbnails");
    cleanupFile(tempPath);
    return res.status(200).json({ success: true, url: cloudResult.url, publicId: cloudResult.publicId });
  } catch (error) {
    if (tempPath) cleanupFile(tempPath);
    return res.status(500).json({ success: false, error: "Thumbnail upload failed" });
  }
});

/**
 * GET /api/upload/abyss-files
 */
router.get("/abyss-files", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const abyssData = await abyssService.getFileList(page, limit);
    const existingVideos = await Video.find({}, { file_code: 1 }).lean();
    const existingCodes = new Set(existingVideos.map((v) => v.file_code));

    const files = (abyssData?.result?.files || abyssData?.files || []).map((file) => ({
      file_code: file.file_code || file.filecode || file.slug,
      title: file.title || file.name || file.file_code,
      thumbnail: `https://abyss.to/splash/${file.file_code || file.slug}.jpg`,
      duration: file.length || file.duration || 0,
      views: file.views || 0,
      alreadyAdded: existingCodes.has(file.file_code || file.filecode || file.slug),
    }));

    return res.status(200).json({ success: true, files, pagination: { page, total: abyssData?.result?.total || files.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch files" });
  }
});

/**
 * GET /api/upload/account-info
 */
router.get("/account-info", async (req, res) => {
  try {
    const info = await abyssService.getAccountInfo();
    return res.status(200).json({ success: true, account: info });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch account info" });
  }
});

module.exports = router;