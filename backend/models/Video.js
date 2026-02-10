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

    thumbnail: {
      type: String,
      default: "",
    },

    // Cloudinary public ID for thumbnail management
    cloudinary_public_id: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "00:00",
    },

    // Duration in seconds (for sorting/filtering)
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

    status: {
      type: String,
      enum: ["public", "private", "unlisted", "processing"],
      default: "public",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
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
  }
);

// Pre-save: generate slug and embed_code
videoSchema.pre("save", function (next) {
  // Generate slug from title + file_code
  if (this.title && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      this.file_code.substring(0, 8);
  }

  // Generate embed URL from file_code
  if (this.file_code && !this.embed_code) {
    this.embed_code = `https://short.icu/${this.file_code}`;
  }

  // Parse duration string to seconds for sorting
  if (this.duration && this.duration !== "00:00" && !this.duration_seconds) {
    const parts = this.duration.split(":").map(Number);
    if (parts.length === 3) {
      this.duration_seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      this.duration_seconds = parts[0] * 60 + parts[1];
    }
  }

  next();
});

// Pre-remove: clean up Cloudinary thumbnail
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

// Text search index
videoSchema.index({ title: "text", tags: "text", description: "text" });

module.exports = mongoose.model("Video", videoSchema);