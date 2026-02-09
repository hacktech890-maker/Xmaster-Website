const axios = require("axios");
const FormData = require("form-data");

const ABYSS_API_KEY = process.env.ABYSS_API_KEY;

const ABYSS_UPLOAD_BASE = "https://up.abyss.to";
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

  async uploadVideo(fileBuffer, fileName) {
    try {
      if (!this.apiKey) {
        throw new Error("ABYSS_API_KEY is missing");
      }

      const formData = new FormData();
      formData.append("file", fileBuffer, fileName);

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

      // Sometimes abyss returns filecode/id, sometimes not
      const filecode = response.data.id || response.data.filecode || slug;

      const embedUrl = `https://short.icu/${slug}`;
      const downloadUrl = `https://abyss.to/${filecode}`;

      // ✅ Correct working thumbnail URL
      const thumbnail = `https://img.abyss.to/preview/${slug}.jpg`;

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
