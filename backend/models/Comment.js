const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 200,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  category: {
    type: String,
    enum: ['suggestion', 'feedback', 'bug', 'feature', 'complaint', 'other'],
    default: 'suggestion',
  },
  isVisible: {
    type: Boolean,
    default: false,  // Hidden by default, admin must approve
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  adminNote: {
    type: String,
    default: '',
    maxlength: 500,
  },
  ip: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for faster queries
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isVisible: 1, createdAt: -1 });
commentSchema.index({ email: 1 });

module.exports = mongoose.model('Comment', commentSchema);