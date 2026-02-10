const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Set ffmpeg path from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

console.log("✅ FFmpeg path:", ffmpegInstaller.path);

/**
 * Extract video duration in seconds
 * @param {string} filePath - Path to video file
 * @returns {Promise<number>} - Duration in seconds
 */
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("❌ FFprobe error:", err.message);
        return resolve(0); // Return 0 instead of rejecting
      }

      const duration = metadata?.format?.duration || 0;
      console.log("⏱️ Video duration:", duration, "seconds");
      resolve(Math.floor(duration));
    });
  });
};

/**
 * Convert seconds to HH:MM:SS or MM:SS format
 * @param {number} seconds
 * @returns {string}
 */
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Extract thumbnail from video at a specific timestamp
 * @param {string} videoPath - Path to video file
 * @param {object} options - { timestamp, width, height }
 * @returns {Promise<string>} - Path to generated thumbnail
 */
const extractThumbnail = (videoPath, options = {}) => {
  return new Promise(async (resolve, reject) => {
    const {
      width = 640,
      height = 360,
      timestamp = null,
    } = options;

    const tempDir = path.join(os.tmpdir(), "xmaster-thumbnails");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const thumbnailName = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const thumbnailPath = path.join(tempDir, thumbnailName);

    try {
      // Get video duration to pick a good timestamp
      let seekTime = timestamp;

      if (!seekTime) {
        const duration = await getVideoDuration(videoPath);

        if (duration > 10) {
          // Take thumbnail at 25% of the video (usually past intros)
          seekTime = Math.floor(duration * 0.25);
        } else if (duration > 3) {
          seekTime = Math.floor(duration * 0.5);
        } else {
          seekTime = 1;
        }
      }

      console.log(`📸 Extracting thumbnail at ${seekTime}s from ${path.basename(videoPath)}`);

      ffmpeg(videoPath)
        .seekInput(seekTime)
        .frames(1)
        .size(`${width}x${height}`)
        .output(thumbnailPath)
        .outputOptions([
          "-q:v", "2",           // High quality JPEG
          "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
        ])
        .on("end", () => {
          // Verify thumbnail was created
          if (fs.existsSync(thumbnailPath)) {
            const stats = fs.statSync(thumbnailPath);
            console.log("✅ Thumbnail generated:", thumbnailPath, `(${(stats.size / 1024).toFixed(1)}KB)`);
            resolve(thumbnailPath);
          } else {
            console.error("❌ Thumbnail file not found after generation");
            resolve(null);
          }
        })
        .on("error", (err) => {
          console.error("❌ Thumbnail extraction error:", err.message);

          // Try simpler extraction as fallback
          console.log("🔄 Trying simple thumbnail extraction...");

          ffmpeg(videoPath)
            .seekInput(1)
            .frames(1)
            .size(`${width}x?`)
            .output(thumbnailPath)
            .on("end", () => {
              if (fs.existsSync(thumbnailPath)) {
                console.log("✅ Fallback thumbnail generated");
                resolve(thumbnailPath);
              } else {
                resolve(null);
              }
            })
            .on("error", (err2) => {
              console.error("❌ Fallback thumbnail also failed:", err2.message);
              resolve(null); // Don't reject, just return null
            })
            .run();
        })
        .run();
    } catch (error) {
      console.error("❌ Thumbnail extraction exception:", error.message);
      resolve(null);
    }
  });
};

/**
 * Get complete video metadata
 * @param {string} filePath
 * @returns {Promise<object>}
 */
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("❌ Metadata error:", err.message);
        return resolve({
          duration: 0,
          durationFormatted: "00:00",
          width: 0,
          height: 0,
          codec: "unknown",
          bitrate: 0,
          size: 0,
        });
      }

      const videoStream = metadata.streams?.find((s) => s.codec_type === "video");
      const duration = Math.floor(metadata?.format?.duration || 0);

      const result = {
        duration: duration,
        durationFormatted: formatDuration(duration),
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        codec: videoStream?.codec_name || "unknown",
        bitrate: Math.floor((metadata?.format?.bit_rate || 0) / 1000),
        size: metadata?.format?.size || 0,
      };

      console.log("📊 Video metadata:", result);
      resolve(result);
    });
  });
};

/**
 * Clean up temporary thumbnail file
 * @param {string} filePath
 */
const cleanupThumbnail = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🧹 Thumbnail temp file cleaned:", path.basename(filePath));
    }
  } catch (err) {
    console.error("⚠️ Thumbnail cleanup error:", err.message);
  }
};

module.exports = {
  getVideoDuration,
  formatDuration,
  extractThumbnail,
  getVideoMetadata,
  cleanupThumbnail,
};