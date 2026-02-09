const express = require("express");
const router = express.Router();
const multer = require("multer");

const abyssService = require("../abyssService"); // ✅ FIXED import
const Video = require("../models/Video");

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
});

/**
 * POST /api/upload/single
 * Upload video to Abyss.to and save to MongoDB
 */
router.post("/single", upload.single("video"), async (req, res) => {
  try {
    console.log("📤 Upload request received");

    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const { title, description, category } = req.body;

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

    // Upload to Abyss
    const abyssData = await abyssService.uploadVideo(
      req.file.buffer,
      req.file.originalname
    );

    const finalFileCode = abyssData.filecode;
    const finalThumbnail = abyssData.thumbnail;
    const finalEmbedUrl = abyssData.embedUrl;

    if (!finalFileCode) throw new Error("Missing file_code from Abyss");
    if (!finalThumbnail) throw new Error("Missing thumbnail from Abyss");

    // Detect duration automatically
    let finalDuration = "00:00";

    // if abyss API returns duration in seconds
    const durationSeconds =
      abyssData.info?.length ||
      abyssData.info?.duration ||
      abyssData.info?.result?.length ||
      0;

    finalDuration = abyssService.secondsToDuration(durationSeconds);

    // Save to DB
    const newVideo = new Video({
      title: title.trim(),
      description: description?.trim() || "",
      file_code: finalFileCode,
      embed_code: finalEmbedUrl,
      thumbnail: finalThumbnail,
      duration: finalDuration, // store as mm:ss string
      views: 0,
      category: safeCategory,
      uploadDate: new Date(),
    });

    await newVideo.save();

    console.log("✅ Video saved:", newVideo._id);

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    return res.status(500).json({
      success: false,
      error: "Upload failed",
      message: error.message,
    });
  }
});

module.exports = router;
