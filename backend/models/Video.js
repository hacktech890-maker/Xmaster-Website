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
      required: true,
    },

    duration: {
      type: String,
      default: "00:00",
    },

    // FIXED: category should be string
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

// Create slug + embed_code before saving
videoSchema.pre("save", function (next) {
  if (this.title && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      this.file_code.substring(0, 8);
  }

  // FIXED: use short.icu format
  if (this.slug && !this.embed_code) {
    this.embed_code = `https://short.icu/${this.slug}`;
  }

  next();
});

videoSchema.index({ title: "text", tags: "text", description: "text" });

module.exports = mongoose.model("Video", videoSchema);
