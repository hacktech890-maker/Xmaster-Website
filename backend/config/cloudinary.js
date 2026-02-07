const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image from file path
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'xmaster/thumbnails',
      resource_type: 'image',
      transformation: [
        { width: 640, height: 360, crop: 'fill' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw error;
  }
};

// Upload image from URL
const uploadFromUrl = async (imageUrl) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'xmaster/thumbnails',
      resource_type: 'image',
      transformation: [
        { width: 640, height: 360, crop: 'fill' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload from URL error:', error.message);
    // Return original URL if Cloudinary fails
    return { secure_url: imageUrl };
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadFromUrl,
  deleteFromCloudinary
};