const axios = require("axios");
const FormData = require("form-data");

class AbyssService {
  constructor() {
    this.apiKey = process.env.ABYSS_API_KEY;
    this.uploadBaseUrl = "https://up.abyss.to";
    this.apiBaseUrl = "https://api.abyss.to";

    if (!this.apiKey) {
      console.error("❌ ABYSS_API_KEY is not set in environment variables");
    }
  }

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
      timeout: 600000,
    });

    console.log("✅ Abyss upload response:", response.data);

    // IMPORTANT: Abyss gives slug + id
    const slug = response.data?.slug;
    const filecode = response.data?.id || response.data?.filecode;

    if (!slug) throw new Error("Abyss upload failed: slug missing");
    if (!filecode) throw new Error("Abyss upload failed: filecode/id missing");

    // Correct embed link
    const embedUrl = `https://short.icu/${slug}`;

    // Correct thumbnail link (working always)
    const thumbnail =
      response.data?.splash_img || `https://abyss.to/splash/${filecode}.jpg`;

    // Optional download link
    const downloadUrl = `https://abyss.to/${filecode}`;

    return {
      slug,
      filecode,
      embedUrl,
      thumbnail,
      downloadUrl,
    };
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
      console.log("⚠️ Error getting file info:", error.message);
      return null;
    }
  }

  secondsToDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

module.exports = new AbyssService();
