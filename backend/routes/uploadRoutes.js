const express = require("express");
const router = express.Router();
const multer = require("multer");
const abyssService = require("../abyssService");
const Video = require("../models/Video");

// Multer memory storage for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
});

// Multer for thumbnail uploads
const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/upload/single
 * Upload video to Abyss.to with client-side thumbnail & duration
 */
router.post("/single", upload.single("video"), async (req, res) => {
  try {
    console.log("📤 Upload request received");

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No video file uploaded" });
    }

    const { title, description, category, duration, thumbnailData } = req.body;

    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const safeCategory =
      category && category.trim() ? category.trim() : "General";

    console.log("📊 Upload details:", {
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      title: title.trim(),
      category: safeCategory,
      clientDuration: duration || "not provided",
      hasThumbnail: !!thumbnailData,
    });

    // 1. Upload to Abyss.to
    const abyssData = await abyssService.uploadVideo(
      req.file.buffer,
      req.file.originalname
    );

    const finalFileCode = abyssData.filecode;
    if (!finalFileCode) {
      throw new Error("Abyss upload succeeded but filecode missing");
    }

    const finalEmbedUrl =
      abyssData.embedUrl || `https://short.icu/${finalFileCode}`;

    // 2. THUMBNAIL: Prefer client-generated base64 thumbnail
    //    (img.abyss.to has DNS issues so abyss thumbnails don't load)
    let finalThumbnail = "";
    if (thumbnailData && thumbnailData.startsWith("data:image")) {
      finalThumbnail = thumbnailData;
      console.log("🖼️  Using client-generated thumbnail (base64)");
    } else {
      finalThumbnail =
        abyssData.thumbnail ||
        `https://img.abyss.to/preview/${finalFileCode}.jpg`;
      console.log("🖼️  Using abyss thumbnail (may not resolve):", finalThumbnail);
    }

    // 3. DURATION: Prefer client-provided duration
    //    Fallback to Abyss file info API
    let finalDuration = "00:00";
    if (duration && duration !== "00:00" && duration !== "0:00") {
      finalDuration = duration;
      console.log("⏱️  Using client-provided duration:", finalDuration);
    } else {
      try {
        const fileInfo = await abyssService.getFileInfo(finalFileCode);
        const durationSeconds =
          fileInfo?.result?.length ||
          fileInfo?.result?.duration ||
          fileInfo?.length ||
          fileInfo?.duration ||
          0;
        if (durationSeconds > 0) {
          finalDuration = abyssService.secondsToDuration(durationSeconds);
          console.log("⏱️  Using abyss duration:", finalDuration);
        }
      } catch (infoErr) {
        console.log("⚠️  Could not fetch duration from Abyss:", infoErr.message);
      }
    }

    // 4. Save to MongoDB
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

    console.log("✅ Video saved:", {
      id: newVideo._id,
      duration: finalDuration,
      thumbnailType: finalThumbnail.startsWith("data:") ? "base64" : "url",
    });

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

/**
 * POST /api/upload/file-code
 * Add a single video by Abyss file code / slug
 */
router.post("/file-code", async (req, res) => {
  try {
    const { file_code, title, category, status, description } = req.body;

    if (!file_code) {
      return res
        .status(400)
        .json({ success: false, error: "file_code is required" });
    }

    const existing = await Video.findOne({ file_code });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Video already exists" });
    }

    const embedUrl = `https://short.icu/${file_code}`;
    const thumbnail = `https://img.abyss.to/preview/${file_code}.jpg`;

    // Try to get duration from Abyss API
    let duration = "00:00";
    try {
      const fileInfo = await abyssService.getFileInfo(file_code);
      const secs =
        fileInfo?.result?.length || fileInfo?.result?.duration || 0;
      if (secs > 0) duration = abyssService.secondsToDuration(secs);
    } catch (e) {
      console.log("⚠️ Could not get duration for", file_code);
    }

    const newVideo = new Video({
      title: title || file_code,
      description: description || "",
      file_code,
      embed_code: embedUrl,
      thumbnail,
      duration,
      views: 0,
      category: category || "General",
      status: status || "public",
      uploadDate: new Date(),
    });

    await newVideo.save();
    res.status(201).json({ success: true, video: newVideo });
  } catch (error) {
    console.error("File code add error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/upload/bulk-file-codes
 * Add multiple videos by file codes at once
 */
router.post("/bulk-file-codes", async (req, res) => {
  try {
    const { videos } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No videos provided" });
    }

    const results = { success: [], failed: [] };

    for (const video of videos) {
      try {
        if (!video.file_code) {
          results.failed.push({
            file_code: "unknown",
            error: "Missing file_code",
          });
          continue;
        }

        const existing = await Video.findOne({ file_code: video.file_code });
        if (existing) {
          results.failed.push({
            file_code: video.file_code,
            error: "Already exists",
          });
          continue;
        }

        const slug = video.file_code;
        const embedUrl = `https://short.icu/${slug}`;
        const thumbnail = `https://img.abyss.to/preview/${slug}.jpg`;

        let duration = "00:00";
        try {
          const fileInfo = await abyssService.getFileInfo(slug);
          const secs =
            fileInfo?.result?.length || fileInfo?.result?.duration || 0;
          if (secs > 0) duration = abyssService.secondsToDuration(secs);
        } catch (e) {
          // ignore
        }

        const newVideo = new Video({
          title: video.title || slug,
          description: video.description || "",
          file_code: slug,
          embed_code: embedUrl,
          thumbnail,
          duration,
          views: 0,
          category: video.category || "General",
          status: video.status || "public",
          uploadDate: new Date(),
        });

        await newVideo.save();
        results.success.push({ file_code: slug, id: newVideo._id });
      } catch (err) {
        results.failed.push({
          file_code: video.file_code,
          error: err.message,
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Bulk add error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/upload/thumbnail
 * Upload a custom thumbnail image, returns base64 data URL
 */
router.post(
  "/thumbnail",
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No thumbnail uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      res.json({ success: true, url: dataUrl });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/upload/url
 * Remote upload from URL (placeholder)
 */
router.post("/url", async (req, res) => {
  res
    .status(501)
    .json({ success: false, error: "Remote upload not implemented yet" });
});

/**
 * GET /api/upload/abyss-files
 * List files from your Abyss.to account
 */
router.get("/abyss-files", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const abyssData = await abyssService.listFiles(
      parseInt(page),
      parseInt(limit)
    );

    const files = abyssData?.result?.files || abyssData?.files || [];

    // Check which files are already in DB
    const fileCodes = files.map(
      (f) => f.file_code || f.filecode || f.slug
    );
    const existing = await Video.find({
      file_code: { $in: fileCodes },
    }).select("file_code");
    const existingCodes = new Set(existing.map((v) => v.file_code));

    const enrichedFiles = files.map((f) => {
      const code = f.file_code || f.filecode || f.slug;
      return {
        file_code: code,
        title: f.title || f.name || code,
        thumbnail: `https://img.abyss.to/preview/${code}.jpg`,
        created: f.created || f.uploaded,
        size: f.size || f.filesize,
        alreadyAdded: existingCodes.has(code),
      };
    });

    res.json({
      success: true,
      files: enrichedFiles,
      pagination: {
        total: abyssData?.result?.total || files.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Abyss files error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message, files: [] });
  }
});

/**
 * GET /api/upload/account-info
 * Get Abyss.to account info
 */
router.get("/account-info", async (req, res) => {
  try {
    const info = await abyssService.getAccountInfo();
    res.json({ success: true, account: info });
  } catch (error) {
    console.error("Account info error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;