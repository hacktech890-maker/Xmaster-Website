const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    file_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ============================
    // ABYSS SLUG
    // The slug extracted from upload response
    // Example: "A74YgdC0_"
    // Used to build: https://abyssplayer.com/{abyssSlug}
    // ============================
    abyssSlug: {
      type: String,
      default: "",
      // index defined below in videoSchema.index() — not here
    },

    // ============================
    // EMBED URL
    // Canonical: https://abyssplayer.com/{slug}
    // Auto-generated in pre-save from abyssSlug or file_code
    // ============================
    embedUrl: {
      type: String,
      default: "",
    },

    // Legacy field — kept for backward compat
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

    // ============================
    // CATEGORY FIELDS
    // ============================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

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
    // SHARE TRACKING
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
      twitter:  { type: Number, default: 0 },
      copy:     { type: Number, default: 0 },
      native:   { type: Number, default: 0 },
      unknown:  { type: Number, default: 0 },
    },

    sharedOnTG: {
      type: Boolean,
      default: false,
      index: true,
    },

    sharedOnTGDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["public", "private", "unlisted", "processing", "duplicate"],
      default: "public",
      index: true,
    },

    // ============================
    // PREMIUM FLAG
    // isPremium: true  → video appears ONLY in Premium section
    // isPremium: false → video appears in public/free section (default)
    // ============================
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ============================
    // DUPLICATE DETECTION
    // ============================
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

    titleNormalized: {
      type: String,
      default: "",
      index: true,
    },

    fileHash: {
      type: String,
      default: "",
      index: true,
    },

    // ============================
    // FUTURE: WATERMARK / CUSTOM DOMAIN
    // Prepared for future UI — not yet implemented
    // ============================
    watermarkLogo: {
      type: String,
      default: "",
    },

    customDomain: {
      type: String,
      default: "",
    },

    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================================
// VIRTUALS
// ==========================================

videoSchema.virtual("bestThumbnail").get(function () {
  return this.thumbnailUrl || this.thumbnail || "";
});

/**
 * resolvedEmbedUrl — always returns a valid abyssplayer.com URL.
 * Handles backward compat with old short.icu / short.ink / abyss.to formats.
 * Used by frontend via the API response.
 */
videoSchema.virtual("resolvedEmbedUrl").get(function () {
  // 1. Already the new format
  if (this.embedUrl && this.embedUrl.includes("abyssplayer.com")) {
    return this.embedUrl;
  }
  // 2. Use abyssSlug
  if (this.abyssSlug) {
    return `https://abyssplayer.com/${this.abyssSlug}`;
  }
  // 3. Normalize embed_code (legacy)
  if (this.embed_code) {
    const slug = _extractSlug(this.embed_code);
    if (slug) return `https://abyssplayer.com/${slug}`;
  }
  // 4. Normalize embedUrl (legacy format)
  if (this.embedUrl) {
    const slug = _extractSlug(this.embedUrl);
    if (slug) return `https://abyssplayer.com/${slug}`;
  }
  // 5. Fall back to file_code
  if (this.file_code) {
    return `https://abyssplayer.com/${this.file_code}`;
  }
  return "";
});

// ==========================================
// PRIVATE HELPER — extract slug from URL
// ==========================================
function _extractSlug(input) {
  if (!input || typeof input !== "string") return null;

  // Handle iframe embed HTML
  const iframeSrcMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) return _extractSlug(iframeSrcMatch[1]);

  try {
    let url = input.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    const parsed   = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const oldHosts = ["short.icu", "short.ink", "abyss.to", "www.abyss.to", "abyssplayer.com", "www.abyssplayer.com"];
    if (oldHosts.some((h) => hostname === h || hostname.endsWith("." + h))) {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    }
  } catch {
    // Not a URL — check if raw slug
    // dash at end of character class, no escape needed
    if (/^[A-Za-z0-9_-]{4,32}$/.test(input.trim())) {
      return input.trim();
    }
  }

  return null;
}

// ==========================================
// Pre-save
// ==========================================
videoSchema.pre("save", function (next) {
  // Auto-generate SEO slug from title
  if (this.title && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      this.file_code.substring(0, 8);
  }

  // Derive abyssSlug from multiple sources (priority order)
  if (!this.abyssSlug) {
    if (this.embedUrl) {
      const s = _extractSlug(this.embedUrl);
      if (s) this.abyssSlug = s;
    }
    if (!this.abyssSlug && this.embed_code) {
      const s = _extractSlug(this.embed_code);
      if (s) this.abyssSlug = s;
    }
    if (!this.abyssSlug && this.file_code) {
      this.abyssSlug = this.file_code;
    }
  }

  // Always ensure embedUrl is the canonical new format
  if (this.abyssSlug) {
    this.embedUrl = `https://abyssplayer.com/${this.abyssSlug}`;
  } else if (this.file_code) {
    this.embedUrl = `https://abyssplayer.com/${this.file_code}`;
  }

  // Keep embed_code in sync for legacy consumers
  if (this.embedUrl && !this.embed_code) {
    this.embed_code = this.embedUrl;
  }

  // Normalize title
  if (this.title) {
    this.titleNormalized = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  // Parse duration to seconds
  if (this.duration && this.duration !== "00:00") {
    const parts = this.duration.split(":").map(Number);
    if (parts.length === 3) {
      this.duration_seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      this.duration_seconds = parts[0] * 60 + parts[1];
    }
  }

  // Keep category / categories in sync
  if (this.category && (!this.categories || this.categories.length === 0)) {
    this.categories = [this.category];
  }
  if (this.categories && this.categories.length > 0 && !this.category) {
    this.category = this.categories[0];
  }

  next();
});

// ==========================================
// Pre-remove — cleanup Cloudinary
// ==========================================
videoSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    if (this.cloudinary_public_id) {
      try {
        const { deleteImage } = require("../config/cloudinary");
        await deleteImage(this.cloudinary_public_id);
      } catch (err) {
        console.error("⚠️ Failed to delete Cloudinary image:", err.message);
      }
    }
  }
);

// ==========================================
// Indexes — NO duplicates
// ==========================================
videoSchema.index({ title: "text", tags: "text", description: "text" });
videoSchema.index({ shares: -1 });
videoSchema.index({ "sharePlatforms.telegram": -1 });
videoSchema.index({ categories: 1 });
videoSchema.index({ isPremium: 1, status: 1, uploadDate: -1 });
// Single index for abyssSlug — do NOT also set index:true on the field itself
videoSchema.index({ abyssSlug: 1 });

module.exports = mongoose.model("Video", videoSchema);