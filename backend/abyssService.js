const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

class AbyssService {
  constructor() {
    this.apiKey = process.env.ABYSS_API_KEY;
    this.uploadBaseUrl = "https://up.abyss.to";

    if (!this.apiKey) {
      console.error("❌ ABYSS_API_KEY is not set in environment variables");
    }
  }

  /**
   * Upload video from file path using stream (memory safe)
   */
  async uploadVideoFromPath(filePath, fileName) {
    if (!this.apiKey) {
      throw new Error("ABYSS_API_KEY missing in env");
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileSize = fs.statSync(filePath).size;
    console.log("📤 Uploading to Abyss.to:", fileName, `(${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: "video/mp4",
    });

    const uploadUrl = `${this.uploadBaseUrl}/${this.apiKey}`;

    const response = await axios.post(uploadUrl, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 1800000, // 30 minutes
    });

    console.log("✅ Abyss raw response:", JSON.stringify(response.data, null, 2));

    const data = response.data;
    const slug = data.slug || data.filecode || data.file_code || data.id;

    if (!slug) {
      console.error("❌ No slug in response:", data);
      throw new Error("Abyss upload failed: no slug in response");
    }

    return {
      filecode: slug,
      slug: slug,
      embedUrl: `https://short.icu/${slug}`,
      rawResponse: data,
    };
  }

  /**
   * Upload video from buffer (writes to temp file first)
   */
  async uploadVideo(fileBuffer, fileName) {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `abyss_${Date.now()}_${fileName}`);

    try {
      fs.writeFileSync(tempPath, fileBuffer);
      const result = await this.uploadVideoFromPath(tempPath, fileName);
      return result;
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (e) {
        console.error("⚠️ Temp cleanup error:", e.message);
      }
    }
  }

  /**
   * Get file info from Abyss API
   */
  async getFileInfo(filecode) {
    try {
      const response = await axios.get("https://api.abyss.to/file/info", {
        params: { api_key: this.apiKey, file_code: filecode },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.log("⚠️ getFileInfo unavailable:", error.message);
      return null;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo() {
    const response = await axios.get("https://api.abyss.to/account/info", {
      params: { api_key: this.apiKey },
      timeout: 10000,
    });
    return response.data;
  }

  /**
   * Get file list from Abyss
   */
  async getFileList(page = 1, perPage = 50) {
    const response = await axios.get("https://api.abyss.to/file/list", {
      params: { api_key: this.apiKey, page, per_page: perPage },
      timeout: 15000,
    });
    return response.data;
  }

  /**
   * Convert seconds to duration string
   */
  secondsToDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

module.exports = new AbyssService();