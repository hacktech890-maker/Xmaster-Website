const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

class AbyssService {
  constructor() {
    this.apiKey = process.env.ABYSS_API_KEY;
    this.apiBaseUrl = process.env.ABYSS_API_BASE_URL || "https://api.abyss.to";
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
      timeout: 1800000,
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
   * Get file info from Abyss API (UPDATED to correct endpoint)
   */
  async getFileInfo(filecode) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/v1/files/${filecode}`, {
        params: { key: this.apiKey },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.log("⚠️ getFileInfo unavailable:", error.message);
      return null;
    }
  }

  /**
   * Get account info (UPDATED to correct endpoint)
   */
  async getAccountInfo() {
    const response = await axios.get(`${this.apiBaseUrl}/v1/about`, {
      params: { key: this.apiKey },
      timeout: 10000,
    });
    return response.data;
  }

  /**
   * Get file list from Abyss (UPDATED to correct endpoint /v1/resources)
   */
  async getFileList(page = 1, perPage = 50) {
    try {
      let allFiles = [];
      let pageToken = null;
      let currentPage = 0;
      const targetPage = page;

      // Abyss uses pageToken pagination, not page numbers
      // We need to iterate through pages to get to the requested page
      while (true) {
        const params = {
          key: this.apiKey,
          type: "files",
          maxResults: perPage,
          orderBy: "createdAt:desc",
        };

        if (pageToken) {
          params.pageToken = pageToken;
        }

        const response = await axios.get(`${this.apiBaseUrl}/v1/resources`, {
          params,
          timeout: 15000,
        });

        const data = response.data;
        const items = (data.items || []).filter((item) => !item.isDir);

        currentPage++;

        if (currentPage === targetPage) {
          // Transform to match expected format
          const files = items.map((item) => ({
            file_code: item.id,
            filecode: item.id,
            slug: item.id,
            title: (item.name || item.id).replace(/\.(mp4|mkv|avi|mov|webm|flv|3gp)$/i, ""),
            name: item.name || item.id,
            size: item.size || 0,
            status: item.status || "ready",
            views: 0,
            created: item.createdAt,
            thumbnail: `https://abyss.to/splash/${item.id}.jpg`,
          }));

          return {
            result: {
              files: files,
              total: files.length,
            },
            files: files,
          };
        }

        // Check for next page
        if (data.pageToken && items.length > 0) {
          pageToken = data.pageToken;
        } else {
          break;
        }
      }

      return { result: { files: [], total: 0 }, files: [] };
    } catch (error) {
      console.error("⚠️ getFileList error:", error.message);
      return { result: { files: [], total: 0 }, files: [] };
    }
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