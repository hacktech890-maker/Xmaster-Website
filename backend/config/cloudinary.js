const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify connection on startup
const verifyCloudinary = async () => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.warn("⚠️ Cloudinary credentials missing in .env");
      return false;
    }

    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connected:", result.status);
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
    return false;
  }
};

/**
 * Upload image buffer or file path to Cloudinary
 * @param {string} filePath - Path to the image file
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Custom public ID (optional)
 * @returns {Object} - { url, publicId, width, height }
 */
const uploadImage = async (filePath, folder = "xmaster-thumbnails", publicId = null) => {
  try {
    const options = {
      folder: folder,
      resource_type: "image",
      quality: "auto:good",
      format: "jpg",
      transformation: [
        {
          width: 640,
          height: 360,
          crop: "fill",
          gravity: "center",
        },
      ],
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, options);

    console.log("✅ Thumbnail uploaded to Cloudinary:", result.secure_url);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload image from buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} publicId - Custom public ID
 * @returns {Object}
 */
const uploadImageBuffer = (buffer, folder = "xmaster-thumbnails", publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folder,
      resource_type: "image",
      quality: "auto:good",
      format: "jpg",
      transformation: [
        {
          width: 640,
          height: 360,
          crop: "fill",
          gravity: "center",
        },
      ],
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error("❌ Cloudinary buffer upload error:", error.message);
        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      }

      console.log("✅ Thumbnail uploaded to Cloudinary:", result.secure_url);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    });

    uploadStream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
    console.log("🧹 Cloudinary image deleted:", publicId);
  } catch (error) {
    console.error("⚠️ Cloudinary delete error:", error.message);
  }
};

module.exports = {
  cloudinary,
  verifyCloudinary,
  uploadImage,
  uploadImageBuffer,
  deleteImage,
};