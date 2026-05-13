const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '📁'
  },
  // Type: 'category' for main categories, 'tag' for tag-style categories
  type: {
    type: String,
    enum: ['category', 'tag'],
    default: 'category'
  },
  // ============================
  // PREMIUM FLAG
  // ============================
  // isPremium: true  → category appears only in Premium section
  // isPremium: false → regular public category (default)
  // Backward-safe: all existing categories default to false
  isPremium: {
    type: Boolean,
    default: false,
    index: true,
  },
  videoCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#ef4444'
  }
}, {
  timestamps: true
});

categorySchema.pre('save', function(next) {
  if (this.isModified('name') || (this.name && !this.slug)) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);