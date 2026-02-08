const axios = require("axios");
const FormData = require("form-data");

const ABYSS_API_KEY = process.env.ABYSS_API_KEY;

// Upload server (IMPORTANT)
const ABYSS_UPLOAD_BASE = "https://up.abyss.to";

// API server (for info/quota etc.)
const ABYSS_API_BASE = "https://api.abyss.to";

class AbyssService {
  constructor() {
    if (!ABYSS_API_KEY) {
      console.warn("⚠️ ABYSS_API_KEY is missing in environment variables!");
    }

    this.apiKey = ABYSS_API_KEY;
    this.uploadBaseUrl = ABYSS_UPLOAD_BASE;
    this.apiBaseUrl = ABYSS_API_BASE;
  }

  /**
   * Upload video to Abyss.to
   * Returns: { filecode, slug, embedUrl, downloadUrl, thumbnail }
   */
  async uploadVideo(fileBuffer, fileName) {
    try {
      if (!this.apiKey) {
        throw new Error("ABYSS_API_KEY is missing");
      }

      const formData = new FormData();
      formData.append("file", fileBuffer, fileName);

      // Correct upload endpoint
      const uploadUrl = `${this.uploadBaseUrl}/${this.apiKey}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      if (!response.data || !response.data.slug) {
        throw new Error("Invalid Abyss.to upload response");
      }

      const slug = response.data.slug;
      const filecode = response.data.id || response.data.filecode || "";

      const embedUrl = `https://short.icu/${slug}`;
      const downloadUrl = filecode ? `https://abyss.to/${filecode}` : embedUrl;

      const thumbnail =
        response.data.splash_img || (filecode ? `https://abyss.to/splash/${filecode}.jpg` : "");

      return {
        filecode,
        slug,
        embedUrl,
        downloadUrl,
        thumbnail,
        rawResponse: response.data,
      };
    } catch (error) {
      console.error("Abyss upload error:", error.response?.data || error.message);
      throw new Error(`Abyss.to upload failed: ${error.message}`);
    }
  }

  /**
   * Get file info from Abyss.to
   */
  async getFileInfo(filecode) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/file/info`, {
        params: {
          api_key: this.apiKey,
          file_code: filecode,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Abyss file info error:", error.message);
      throw error;
    }
  }

  /**
   * Get account info / quota
   */
  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/account/info`, {
        params: {
          api_key: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Abyss account info error:", error.message);
      throw error;
    }
  }
}

module.exports = new AbyssService();
