const axios = require("axios");
const FormData = require("form-data");

class AbyssService {
  constructor() {
    this.apiKey = process.env.ABYSS_API_KEY;
    this.uploadBaseUrl = "https://up.abyss.to";

    if (!this.apiKey) {
      console.error("❌ ABYSS_API_KEY is not set in environment variables");
    }
  }

  /**
   * Upload video to Abyss.to
   * Returns: { filecode, slug, embedUrl, thumbnail, rawResponse }
   */
  async uploadVideo(fileBuffer, fileName) {
    if (!this.apiKey) {
      throw new Error("ABYSS_API_KEY missing in env");
    }

    console.log("📤 Uploading video to Abyss.to:", fileName);

    const formData = new FormData();
    formData.append("file", fileBuffer, fileName);

    const uploadUrl = `${this.uploadBaseUrl}/${this.apiKey}`;

    const response = await axios.post(uploadUrl, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 600000, // 10 minutes
    });

    console.log("✅ Abyss upload response:", JSON.stringify(response.data));

    const slug = response.data?.slug;
    if (!slug) {
      throw new Error("Abyss upload failed: slug missing from response");
    }

    const embedUrl =
      response.data?.urlIframe || `https://short.icu/${slug}`;

    // NOTE: img.abyss.to often has DNS issues (ERR_NAME_NOT_RESOLVED)
    // Client-side thumbnail generation is the PRIMARY source
    // This is only kept as a fallback reference
    const abyssThumbnail = `https://img.abyss.to/preview/${slug}.jpg`;

    return {
      filecode: slug,
      slug,
      embedUrl,
      thumbnail: abyssThumbnail,
      rawResponse: response.data,
    };
  }

  /**
   * Get file info from Abyss API (duration, size, etc.)
   */
  async getFileInfo(filecode) {
    try {
      if (!this.apiKey) return null;

      const response = await axios.get("https://api.abyss.to/file/info", {
        params: {
          api_key: this.apiKey,
          file_code: filecode,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.log("⚠️ Abyss file info not available:", error.message);
      return null;
    }
  }

  /**
   * List files from Abyss.to account
   */
  async listFiles(page = 1, perPage = 50) {
    try {
      if (!this.apiKey) throw new Error("ABYSS_API_KEY missing");

      const response = await axios.get("https://api.abyss.to/file/list", {
        params: {
          api_key: this.apiKey,
          page,
          per_page: perPage,
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      console.error("Abyss list files error:", error.message);
      throw error;
    }
  }

  /**
   * Get Abyss.to account info
   */
  async getAccountInfo() {
    try {
      if (!this.apiKey) throw new Error("ABYSS_API_KEY missing");

      const response = await axios.get("https://api.abyss.to/account/info", {
        params: { api_key: this.apiKey },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("Abyss account info error:", error.message);
      throw error;
    }
  }

  /**
   * Convert seconds to duration string (MM:SS or HH:MM:SS)
   */
  secondsToDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";

    const totalSec = Math.floor(seconds);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

module.exports = new AbyssService();