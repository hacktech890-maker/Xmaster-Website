const express = require("express");
const router = express.Router();
const multer = require("multer");

const abyssService = require("../abyssServices");
const Video = require("../models/Video");

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
});

/**
 * POST /api/upload/single
 * Upload video to Abyss.to and save to MongoDB
 */
router.post("/single", upload.single("video"), async (req, res) => {
  try {
    console.log("📤 Upload request received");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No video file uploaded",
      });
    }

    const { title, description, category } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const safeCategory =
      category && category.trim() ? category.trim() : "General";

    console.log("📊 Upload details:", {
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      title: title.trim(),
      category: safeCategory,
    });

    // Upload to Abyss
    const abyssData = await abyssService.uploadVideo(
      req.file.buffer,
      req.file.originalname
    );

    const finalFileCode = abyssData.filecode;
    const finalEmbedUrl = abyssData.embedUrl || "";
    const finalThumbnail =
      abyssData.thumbnail ||
      (finalFileCode ? `https://abyss.to/splash/${finalFileCode}.jpg` : "");

    if (!finalFileCode) {
      throw new Error("Abyss upload succeeded but filecode missing");
    }

    // Fetch duration from Abyss API
    let finalDuration = "00:00";

    try {
      const fileInfo = await abyssService.getFileInfo(finalFileCode);

      const durationSeconds =
        fileInfo?.result?.length ||
        fileInfo?.result?.duration ||
        fileInfo?.length ||
        fileInfo?.duration ||
        0;

      finalDuration = abyssService.secondsToDuration(durationSeconds);
    } catch (infoErr) {
      console.log("⚠️ Could not fetch Abyss file info:", infoErr.message);
    }

    // Save to DB
    const newVideo = new Video({
      title: title.trim(),
      description: description?.trim() || "",
      file_code: finalFileCode,
      embed_code: finalEmbedUrl,
      thumbnail: finalThumbnail,
      duration: finalDuration,
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
