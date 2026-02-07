const express = require('express');
const router = express.Router();
const multer = require('multer');
const abyssService = require('../config/abyss');
const Video = require('../models/Video');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

// Multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit
  },
});

/**
 * POST /api/upload
 * Upload video to Abyss.to and save to MongoDB
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    console.log('📤 Upload request received');

    // 1. Validate file
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // 2. Validate required fields
    const { title, description, duration, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    console.log('📊 Upload details:', {
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      title,
      category: category || 'General',
    });

    // 3. Upload video to Abyss.to
    console.log('☁️ Uploading to Abyss.to...');
    const abyssData = await abyssService.uploadVideo(
      req.file.buffer,
      req.file.originalname
    );

    console.log('✅ Abyss upload successful:', {
      filecode: abyssData.filecode,
      slug: abyssData.slug,
      embedUrl: abyssData.embedUrl,
    });

    // 4. Handle thumbnail upload
    let thumbnailUrl = abyssData.thumbnail; // Default to Abyss thumbnail
    
    // If user uploaded custom thumbnail
    if (req.files && req.files.thumbnail) {
      try {
        console.log('🖼️ Uploading custom thumbnail to Cloudinary...');
        
        // Resize and optimize thumbnail
        const optimizedBuffer = await sharp(req.files.thumbnail.buffer)
          .resize(1280, 720, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Upload to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'xmaster/thumbnails',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(optimizedBuffer);
        });

        thumbnailUrl = cloudinaryResult.secure_url;
        console.log('✅ Custom thumbnail uploaded:', thumbnailUrl);

      } catch (thumbError) {
        console.error('⚠️ Thumbnail upload failed, using Abyss thumbnail:', thumbError.message);
        // Fall back to Abyss thumbnail
      }
    }

    // 5. Create video document
    const newVideo = new Video({
      title: title.trim(),
      description: description?.trim() || '',
      file_code: abyssData.filecode,
      embed_code: abyssData.embedUrl,  // CRITICAL: Store short.icu URL
      download_url: abyssData.downloadUrl,
      thumbnail: thumbnailUrl,
      duration: parseInt(duration) || 0,
      views: 0,
      category: category || 'General',
      uploadedBy: req.user?._id || null, // If you have auth
      uploadDate: new Date(),
    });

    await newVideo.save();

    console.log('✅ Video saved to database:', newVideo._id);

    // 6. Return success response
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: newVideo._id,
        title: newVideo.title,
        embedUrl: newVideo.embed_code,
        thumbnail: newVideo.thumbnail,
        filecode: newVideo.file_code,
      },
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/upload/quota
 * Check Abyss.to account quota
 */
router.get('/quota', async (req, res) => {
  try {
    const accountInfo = await abyssService.getAccountInfo();
    res.json({
      quota: accountInfo,
      provider: 'Abyss.to',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
