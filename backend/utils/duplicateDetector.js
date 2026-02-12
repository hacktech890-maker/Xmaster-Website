const Video = require("../models/Video");

class DuplicateDetector {
  /**
   * Check if a video is a duplicate before saving
   * Returns { isDuplicate: bool, duplicateOf: videoId, reasons: [] }
   */
  static async checkDuplicate(videoData) {
    const results = {
      isDuplicate: false,
      duplicateOf: null,
      reasons: [],
      matches: [],
    };

    try {
      // 1. Check by normalized title
      const titleMatch = await this.checkByTitle(videoData.title);
      if (titleMatch) {
        results.isDuplicate = true;
        results.duplicateOf = results.duplicateOf || titleMatch._id;
        results.reasons.push("title");
        results.matches.push({
          type: "title",
          originalId: titleMatch._id,
          originalTitle: titleMatch.title,
        });
      }

      // 2. Check by duration (if available and > 0)
      if (videoData.duration_seconds && videoData.duration_seconds > 0) {
        const durationMatch = await this.checkByDuration(
          videoData.duration_seconds,
          videoData.title
        );
        if (durationMatch) {
          results.isDuplicate = true;
          results.duplicateOf = results.duplicateOf || durationMatch._id;
          if (!results.reasons.includes("duration")) {
            results.reasons.push("duration");
          }
          results.matches.push({
            type: "duration",
            originalId: durationMatch._id,
            originalTitle: durationMatch.title,
            originalDuration: durationMatch.duration,
          });
        }
      }

      // 3. Check by file hash (if available)
      if (videoData.fileHash) {
        const fileMatch = await this.checkByFileHash(videoData.fileHash);
        if (fileMatch) {
          results.isDuplicate = true;
          results.duplicateOf = results.duplicateOf || fileMatch._id;
          if (!results.reasons.includes("file")) {
            results.reasons.push("file");
          }
          results.matches.push({
            type: "file",
            originalId: fileMatch._id,
            originalTitle: fileMatch.title,
          });
        }
      }

      // 4. Check by file_code (exact same video)
      if (videoData.file_code) {
        const codeMatch = await Video.findOne({ file_code: videoData.file_code });
        if (codeMatch) {
          results.isDuplicate = true;
          results.duplicateOf = codeMatch._id;
          if (!results.reasons.includes("file")) {
            results.reasons.push("file");
          }
        }
      }
    } catch (error) {
      console.error("⚠️ Duplicate check error:", error.message);
    }

    return results;
  }

  /**
   * Check by normalized title
   */
  static async checkByTitle(title) {
    if (!title) return null;

    const normalized = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    if (normalized.length < 5) return null; // Too short to match

    // Exact normalized title match
    const exactMatch = await Video.findOne({
      titleNormalized: normalized,
      isDuplicate: false,
      status: { $ne: "duplicate" },
    });

    if (exactMatch) return exactMatch;

    // Fuzzy match - titles that are very similar
    // Find videos where 80%+ of the normalized title matches
    const allVideos = await Video.find({
      isDuplicate: false,
      status: { $ne: "duplicate" },
      titleNormalized: { $exists: true, $ne: "" },
    })
      .select("title titleNormalized _id")
      .limit(1000);

    for (const video of allVideos) {
      if (!video.titleNormalized) continue;
      const similarity = this.calculateSimilarity(normalized, video.titleNormalized);
      if (similarity >= 0.85) {
        return video;
      }
    }

    return null;
  }

  /**
   * Check by duration (same duration + similar title = likely duplicate)
   */
  static async checkByDuration(durationSeconds, title) {
    if (!durationSeconds || durationSeconds <= 0) return null;

    // Find videos with exact same duration (±2 seconds tolerance)
    const matches = await Video.find({
      duration_seconds: {
        $gte: durationSeconds - 2,
        $lte: durationSeconds + 2,
      },
      isDuplicate: false,
      status: { $ne: "duplicate" },
    })
      .select("title titleNormalized duration duration_seconds _id")
      .limit(50);

    if (matches.length === 0) return null;

    // If same duration AND similar title, it's likely a duplicate
    if (title) {
      const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      for (const match of matches) {
        if (!match.titleNormalized) continue;
        const similarity = this.calculateSimilarity(normalized, match.titleNormalized);
        if (similarity >= 0.5) {
          return match;
        }
      }
    }

    return null;
  }

  /**
   * Check by file hash
   */
  static async checkByFileHash(hash) {
    if (!hash) return null;

    return await Video.findOne({
      fileHash: hash,
      isDuplicate: false,
      status: { $ne: "duplicate" },
    });
  }

  /**
   * Calculate string similarity (0-1)
   * Uses Levenshtein distance based approach
   */
  static calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    // Quick check - if one contains the other
    if (longer.includes(shorter) || shorter.includes(longer)) {
      return shorter.length / longer.length;
    }

    // Levenshtein distance
    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter[i - 1] !== longer[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[longer.length] = lastValue;
    }

    return (longer.length - costs[longer.length]) / longer.length;
  }

  /**
   * Scan entire database for duplicates (admin action)
   */
  static async scanAllDuplicates() {
    console.log("🔍 Starting full duplicate scan...");

    const videos = await Video.find({
      isDuplicate: false,
      status: { $ne: "duplicate" },
    })
      .sort({ uploadDate: 1 })
      .select("title titleNormalized duration duration_seconds file_code fileHash _id");

    let duplicatesFound = 0;
    const processed = new Set();

    for (let i = 0; i < videos.length; i++) {
      if (processed.has(videos[i]._id.toString())) continue;

      for (let j = i + 1; j < videos.length; j++) {
        if (processed.has(videos[j]._id.toString())) continue;

        const reasons = [];

        // Check title similarity
        if (videos[i].titleNormalized && videos[j].titleNormalized) {
          const similarity = this.calculateSimilarity(
            videos[i].titleNormalized,
            videos[j].titleNormalized
          );
          if (similarity >= 0.85) {
            reasons.push("title");
          }
        }

        // Check duration match
        if (
          videos[i].duration_seconds > 0 &&
          videos[j].duration_seconds > 0 &&
          Math.abs(videos[i].duration_seconds - videos[j].duration_seconds) <= 2
        ) {
          reasons.push("duration");
        }

        // Check file hash
        if (
          videos[i].fileHash &&
          videos[j].fileHash &&
          videos[i].fileHash === videos[j].fileHash
        ) {
          reasons.push("file");
        }

        // If any match found, mark the newer one as duplicate
        if (reasons.length > 0) {
          await Video.findByIdAndUpdate(videos[j]._id, {
            isDuplicate: true,
            duplicateOf: videos[i]._id,
            duplicateReasons: reasons,
            status: "private",
          });

          processed.add(videos[j]._id.toString());
          duplicatesFound++;
          console.log(
            `🔄 Duplicate found: "${videos[j].title}" → matches "${videos[i].title}" [${reasons.join(", ")}]`
          );
        }
      }
    }

    console.log(`✅ Scan complete. Found ${duplicatesFound} duplicates.`);
    return { duplicatesFound, totalScanned: videos.length };
  }
}

module.exports = DuplicateDetector;