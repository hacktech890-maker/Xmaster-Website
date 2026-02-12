const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    file_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    embed_code: {
      type: String,
      default: "",
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    // ============================
    // THUMBNAIL FIELDS
    // ============================
    thumbnail: {
      type: String,
      default: "",
    },

    // ✅ NEW (Recommended for Telegram OG tags)
    thumbnailUrl: {
      type: String,
      default: "",
    },

    cloudinary_public_id: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "00:00",
    },

    duration_seconds: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      default: "General",
      index: true,
    },

    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    views: {
      type: Number,
      default: 0,
      index: true,
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    // ============================
    // SHARE TRACKING (OPTIONAL)
    // ============================
    shares: {
      type: Number,
      default: 0,
      index: true,
    },

    sharePlatforms: {
      telegram: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      copy: { type: Number, default: 0 },
      native: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["public", "private", "unlisted", "processing", "duplicate"],
      default: "public",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ==========================================
    // DUPLICATE DETECTION FIELDS
    // ==========================================
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    duplicateReasons: [
      {
        type: String,
        enum: ["title", "duration", "file", "thumbnail"],
      },
    ],

    // Normalized title for comparison (lowercase, no spaces/special chars)
    titleNormalized: {
      type: String,
      default: "",
      index: true,
    },

    // File hash for content matching
    fileHash: {
      type: String,
      default: "",
      index: true,
    },

    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,

    // ✅ Important: include virtual fields when sending JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================================
// VIRTUALS
// ==========================================

// ✅ Best thumbnail getter (useful for OG tags and API)
videoSchema.virtual("bestThumbnail").get(function () {
  return this.thumbnailUrl || this.thumbnail || "";
});

// ==========================================
// Pre-save: generate slug, embed_code, normalized title, duration_seconds
// ==========================================
videoSchema.pre("save", function (next) {
  // Generate slug
  if (this.title && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      this.file_code.substring(0, 8);
  }

  // Generate embed URL
  if (this.file_code && !this.embed_code) {
    this.embed_code = `https://short.icu/${this.file_code}`;
  }

  // Normalize title for duplicate detection
  if (this.title) {
    this.titleNormalized = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  // Parse duration string to seconds
  if (this.duration && this.duration !== "00:00") {
    const parts = this.duration.split(":").map(Number);

    if (parts.length === 3) {
      this.duration_seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      this.duration_seconds = parts[0] * 60 + parts[1];
    }
  }

  next();
});

// ==========================================
// Pre-remove: clean up Cloudinary thumbnail
// ==========================================
videoSchema.pre("deleteOne", { document: true, query: false }, async function () {
  if (this.cloudinary_public_id) {
    try {
      const { deleteImage } = require("../config/cloudinary");
      await deleteImage(this.cloudinary_public_id);
    } catch (err) {
      console.error("⚠️ Failed to delete Cloudinary image:", err.message);
    }
  }
});

// ==========================================
// Indexes
// ==========================================

// Text search index
videoSchema.index({ title: "text", tags: "text", description: "text" });

// Extra indexes for share tracking
videoSchema.index({ shares: -1 });
videoSchema.index({ "sharePlatforms.telegram": -1 });

module.exports = mongoose.model("Video", videoSchema);
