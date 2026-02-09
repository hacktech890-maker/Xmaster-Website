const express = require("express");
const router = express.Router();
const multer = require("multer");
const abyssService = require("../config/abyss");
const Video = require("../models/Video");
const cloudinary = require("../config/cloudinary");
const sharp = require("sharp");

// Multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB
  },
});

/**
 * POST /api/upload/single
 * Upload video to Abyss.to and save to MongoDB
 */
router.post("/single", upload.single("video"), async (req, res) => {
  try {
    console.log("📤 Upload request received");

    // 1) Validate file
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    // 2) Validate fields
    const { title, description, duration, category } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const safeCategory = category && category.trim() ? category.trim() : "General";

    console.log("📊 Upload details:", {
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      title,
      category: safeCategory,
    });

    // 3) Upload video to Abyss.to
    console.log("☁️ Uploading to Abyss.to...");
    const abyssData = await abyssService.uploadVideo(req.file.buffer, req.file.originalname);

    console.log("✅ Abyss upload successful:", {
      filecode: abyssData.filecode,
      slug: abyssData.slug,
      embedUrl: abyssData.embedUrl,
      thumbnail: abyssData.thumbnail,
    });

    // 4) Fix missing filecode
    const finalFileCode = abyssData.filecode || abyssData.slug;

    // 5) Fix missing thumbnail
    const finalThumbnail =
      abyssData.thumbnail ||
      (abyssData.slug ? `https://img.abyss.to/preview/${abyssData.slug}.jpg` : "");

    if (!finalFileCode) {
      throw new Error("Abyss upload failed: missing file_code/slug");
    }

    if (!finalThumbnail) {
      throw new Error("Abyss upload failed: missing thumbnail");
    }

    // 6) Save video in MongoDB
    const newVideo = new Video({
      title: title.trim(),
      description: description?.trim() || "",
      file_code: finalFileCode,
      embed_code: abyssData.embedUrl, // short.icu link
      download_url: abyssData.downloadUrl || "",
      thumbnail: finalThumbnail,
      duration: parseInt(duration) || 0,
      views: 0,
      category: safeCategory,
      uploadedBy: req.user?._id || null,
      uploadDate: new Date(),
    });

    await newVideo.save();

    console.log("✅ Video saved to database:", newVideo._id);

    // 7) Response
    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: {
        id: newVideo._id,
        title: newVideo.title,
        embedUrl: newVideo.embed_code,
        thumbnail: newVideo.thumbnail,
        filecode: newVideo.file_code,
        category: newVideo.category,
      },
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    return res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/upload/quota
 */
router.get("/quota", async (req, res) => {
  try {
    const accountInfo = await abyssService.getAccountInfo();

    res.json({
      success: true,
      provider: "Abyss.to",
      quota: accountInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
