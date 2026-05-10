// backend/models/ContactSubmission.js
const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 80,
    },

    email: {
      type:      String,
      required:  true,
      trim:      true,
      lowercase: true,
      maxlength: 120,
      match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },

    message: {
      type:      String,
      default:   '',
      trim:      true,
      maxlength: 2000,
    },

    // For spam prevention — store the requester IP (hashed in production)
    ipAddress: {
      type:    String,
      default: '',
    },

    // Admin read/unread status
    read: {
      type:    Boolean,
      default: false,
      index:   true,
    },

    // Admin notes
    adminNote: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for admin listing
contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
