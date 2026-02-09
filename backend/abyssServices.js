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

    const slug = response.data?.slug;
    const embedUrl = response.data?.urlIframe || (slug ? `https://short.icu/${slug}` : "");

    if (!slug) {
      throw new Error("Abyss upload failed: slug missing");
    }

    // Abyss preview image uses slug
    const thumbnail = `https://img.abyss.to/preview/${slug}.jpg`;

    return {
      filecode: slug, // store slug in DB as file_code
      slug,
      embedUrl,
      thumbnail,
    };
  }

  // Not available anymore (remove usage)
  async getFileInfo() {
    return null;
  }

  secondsToDuration() {
    return "00:00";
  }
}

module.exports = new AbyssService();
