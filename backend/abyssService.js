const axios = require("axios");
const FormData = require("form-data");
const stream = require("stream");

class AbyssService {
  constructor() {
    this.apiKey = process.env.ABYSS_API_KEY;
    this.apiBaseUrl = process.env.ABYSS_API_BASE_URL || "https://api.abyss.to";
    this.uploadBaseUrl = "https://up.abyss.to";

    if (!this.apiKey) {
      console.error("❌ ABYSS_API_KEY is not set in environment variables");
    }
  }

  // Upload video buffer to Abyss.to
  async uploadVideo(fileBuffer, fileName) {
    try {
      console.log("📤 Uploading video to Abyss.to:", fileName);

      const formData = new FormData();

      // convert buffer to stream
      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileBuffer);

      formData.append("file", bufferStream, fileName);

      const uploadUrl = `${this.uploadBaseUrl}/${this.apiKey}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000,
      });

      // Abyss usually returns slug/filecode
      const fileCode = response.data?.slug || response.data?.filecode;

      if (!fileCode) {
        throw new Error("Upload failed: Abyss did not return file_code/slug");
      }

      // Auto generate embed + thumbnail
      const embedUrl = `https://short.icu/${fileCode}`;
      const thumbnail = `https://img.abyss.to/preview/${fileCode}.jpg`;

      // Try getting file info (for duration)
      const info = await this.getFileInfo(fileCode);

      return {
        filecode: fileCode,
        slug: fileCode,
        embedUrl,
        thumbnail,
        info,
      };
    } catch (error) {
      console.error("❌ Error uploading video to Abyss.to:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }

  // Get file info (duration, size etc)
  async getFileInfo(fileId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/v1/files/${fileId}`, {
        params: { key: this.apiKey },
      });

      return response.data;
    } catch (error) {
      console.error("⚠️ Error getting file info from Abyss.to:", error.message);
      return null;
    }
  }

  // Convert seconds to mm:ss
  secondsToDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
}

module.exports = new AbyssService();
