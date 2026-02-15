const Video = require("../models/Video");

class DuplicateDetector {
  /**
   * Check if a video is a duplicate before saving
   * STRICT MODE: Only marks as duplicate when genuinely the same video
   * 
   * Rules:
   * - Same file_code = REAL duplicate (100% certain)
   * - Same file hash = REAL duplicate (100% certain)
   * - Exact same title AND exact same duration = LIKELY duplicate
   * - Title similarity alone = NEVER a duplicate
   * - Duration similarity alone = NEVER a duplicate
   */
  static async checkDuplicate(videoData, excludeId = null) {
    const results = {
      isDuplicate: false,
      duplicateOf: null,
      reasons: [],
      matches: [],
      confidence: 0,
    };

    try {
      const excludeQuery = excludeId ? { _id: { $ne: excludeId } } : {};

      // ============================================
      // CHECK 1: Exact file_code match (DEFINITIVE)
      // Same file_code = literally the same video file on Abyss.to
      // ============================================
      if (videoData.file_code) {
        const codeMatch = await Video.findOne({
          file_code: videoData.file_code,
          isDuplicate: { $ne: true },
          ...excludeQuery,
        }).lean();

        if (codeMatch) {
          results.isDuplicate = true;
          results.duplicateOf = codeMatch._id;
          results.confidence = 100;
          results.reasons.push("file");
          results.matches.push({
            type: "file",
            originalId: codeMatch._id,
            originalTitle: codeMatch.title,
            originalFileCode: codeMatch.file_code,
            confidence: 100,
          });
          return results; // No need to check further
        }
      }

      // ============================================
      // CHECK 2: File hash match (DEFINITIVE)
      // Same hash = same actual video content
      // ============================================
      if (videoData.fileHash && videoData.fileHash.length > 10) {
        const hashMatch = await Video.findOne({
          fileHash: videoData.fileHash,
          isDuplicate: { $ne: true },
          status: { $ne: "duplicate" },
          ...excludeQuery,
        }).lean();

        if (hashMatch) {
          results.isDuplicate = true;
          results.duplicateOf = hashMatch._id;
          results.confidence = 100;
          results.reasons.push("file");
          results.matches.push({
            type: "file",
            originalId: hashMatch._id,
            originalTitle: hashMatch.title,
            confidence: 100,
          });
          return results; // No need to check further
        }
      }

      // ============================================
      // CHECK 3: Exact title + Exact duration (HIGH CONFIDENCE)
      // Both must match EXACTLY — no fuzzy matching
      // ============================================
      if (videoData.title && videoData.duration_seconds && videoData.duration_seconds > 0) {
        const normalized = this.normalizeTitle(videoData.title);

        if (normalized && normalized.length >= 10) {
          const exactMatch = await Video.findOne({
            titleNormalized: normalized,
            duration_seconds: videoData.duration_seconds, // EXACT seconds, no tolerance
            isDuplicate: { $ne: true },
            status: { $ne: "duplicate" },
            ...excludeQuery,
          }).lean();

          if (exactMatch) {
            results.isDuplicate = true;
            results.duplicateOf = exactMatch._id;
            results.confidence = 90;
            results.reasons.push("title", "duration");
            results.matches.push({
              type: "title+duration",
              originalId: exactMatch._id,
              originalTitle: exactMatch.title,
              originalDuration: exactMatch.duration,
              confidence: 90,
            });
            return results;
          }
        }
      }

      // ============================================
      // NO MORE CHECKS!
      // 
      // We deliberately DO NOT check:
      // ❌ Title similarity alone (causes massive false positives)
      // ❌ Duration with tolerance (2:11 ≠ 2:13)
      // ❌ Fuzzy title matching (85% similar ≠ same video)
      // ❌ Duration + partial title (too unreliable)
      //
      // Different file_code = different video. Period.
      // ============================================

    } catch (error) {
      console.error("⚠️ Duplicate check error:", error.message);
    }

    return results;
  }

  /**
   * Normalize title for comparison
   * Strips everything except lowercase alphanumeric
   */
  static normalizeTitle(title) {
    if (!title) return "";
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Scan entire database for duplicates (admin action)
   * STRICT: Only flags videos with same file_code as duplicates
   */
  static async scanAllDuplicates() {
    console.log("🔍 Starting STRICT duplicate scan...");
    console.log("   Only same file_code or same hash = duplicate");
    console.log("   Title/duration similarity alone will NOT flag duplicates\n");

    let duplicatesFound = 0;
    let totalScanned = 0;

    // ============================================
    // PASS 1: Find duplicate file_codes
    // ============================================
    console.log("📋 Pass 1: Checking for duplicate file_codes...");

    const duplicateFileCodes = await Video.aggregate([
      {
        $match: {
          file_code: { $exists: true, $ne: "", $ne: null },
        },
      },
      {
        $group: {
          _id: "$file_code",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          titles: { $push: "$title" },
          dates: { $push: "$uploadDate" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const group of duplicateFileCodes) {
      // Get full video details sorted by upload date (oldest first = original)
      const videos = await Video.find({ file_code: group._id })
        .sort({ uploadDate: 1 })
        .select("_id title file_code uploadDate views isDuplicate")
        .lean();

      // Keep the first one (oldest/most viewed), mark rest as duplicates
      const original = videos[0];
      const dupes = videos.slice(1);

      for (const dupe of dupes) {
        if (dupe.isDuplicate) continue; // Already marked

        await Video.findByIdAndUpdate(dupe._id, {
          isDuplicate: true,
          duplicateOf: original._id,
          duplicateReasons: ["file"],
        });
        // Do NOT change status to private — keep it as is

        duplicatesFound++;
        console.log(
          `   🔄 "${dupe.title}" is duplicate of "${original.title}" [same file_code: ${group._id}]`
        );
      }
    }

    console.log(`   Found ${duplicateFileCodes.length} duplicate file_code groups\n`);

    // ============================================
    // PASS 2: Find duplicate file hashes
    // ============================================
    console.log("📋 Pass 2: Checking for duplicate file hashes...");

    const duplicateHashes = await Video.aggregate([
      {
        $match: {
          fileHash: { $exists: true, $ne: "", $ne: null },
          isDuplicate: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$fileHash",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const group of duplicateHashes) {
      const videos = await Video.find({
        fileHash: group._id,
        isDuplicate: { $ne: true },
      })
        .sort({ uploadDate: 1 })
        .select("_id title fileHash uploadDate isDuplicate")
        .lean();

      if (videos.length < 2) continue;

      const original = videos[0];
      const dupes = videos.slice(1);

      for (const dupe of dupes) {
        await Video.findByIdAndUpdate(dupe._id, {
          isDuplicate: true,
          duplicateOf: original._id,
          duplicateReasons: ["file"],
        });

        duplicatesFound++;
        console.log(
          `   🔄 "${dupe.title}" is duplicate of "${original.title}" [same hash]`
        );
      }
    }

    console.log(`   Found ${duplicateHashes.length} duplicate hash groups\n`);

    // ============================================
    // PASS 3: Exact title + exact duration
    // ============================================
    console.log("📋 Pass 3: Checking exact title + exact duration matches...");

    const titleDurationDupes = await Video.aggregate([
      {
        $match: {
          isDuplicate: { $ne: true },
          titleNormalized: { $exists: true, $ne: "" },
          duration_seconds: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            title: "$titleNormalized",
            duration: "$duration_seconds",
          },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const group of titleDurationDupes) {
      const videos = await Video.find({
        _id: { $in: group.ids },
        isDuplicate: { $ne: true },
      })
        .sort({ uploadDate: 1, views: -1 })
        .select("_id title titleNormalized duration_seconds file_code uploadDate isDuplicate")
        .lean();

      if (videos.length < 2) continue;

      // IMPORTANT: Only mark if they have DIFFERENT file_codes
      // If same file_code, Pass 1 already handled it
      const original = videos[0];
      const dupes = videos.slice(1);

      for (const dupe of dupes) {
        // Skip if same file_code (already handled)
        if (dupe.file_code === original.file_code) continue;

        await Video.findByIdAndUpdate(dupe._id, {
          isDuplicate: true,
          duplicateOf: original._id,
          duplicateReasons: ["title", "duration"],
        });

        duplicatesFound++;
        console.log(
          `   🔄 "${dupe.title}" matches "${original.title}" [exact title + exact duration: ${original.duration_seconds}s]`
        );
      }
    }

    console.log(`   Found ${titleDurationDupes.length} exact title+duration groups\n`);

    // Final count
    totalScanned = await Video.countDocuments({});
    const totalDuplicates = await Video.countDocuments({ isDuplicate: true });

    console.log("====================================");
    console.log(`✅ Scan complete!`);
    console.log(`   Total videos scanned: ${totalScanned}`);
    console.log(`   New duplicates found: ${duplicatesFound}`);
    console.log(`   Total duplicates now: ${totalDuplicates}`);
    console.log(`   Videos showing: ${totalScanned - totalDuplicates}`);
    console.log("====================================\n");

    return {
      duplicatesFound,
      totalScanned,
      totalDuplicates,
    };
  }
}

module.exports = DuplicateDetector;