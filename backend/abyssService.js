const axios  = require("axios");
const FormData = require("form-data");
const fs     = require("fs");
const path   = require("path");
const os     = require("os");

const { extractAbyssSlug, buildEmbedUrl } = require("./utils/abyssHelper");

class AbyssService {
  constructor() {
    this.apiKey       = process.env.ABYSS_API_KEY;
    this.apiBaseUrl   = process.env.ABYSS_API_BASE_URL || "https://api.abyss.to";
    this.uploadBaseUrl = "https://up.abyss.to";

    if (!this.apiKey) {
      console.error("❌ ABYSS_API_KEY is not set in environment variables");
    }
  }

  /**
   * Upload video from file path using stream (memory safe).
   *
   * Returns:
   * {
   *   slug:     "A74YgdC0_",
   *   filecode: "A74YgdC0_",
   *   embedUrl: "https://abyssplayer.com/A74YgdC0_",
   *   rawResponse: { ... }
   * }
   */
  async uploadVideoFromPath(filePath, fileName) {
    if (!this.apiKey) {
      throw new Error("ABYSS_API_KEY missing in env");
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileSize = fs.statSync(filePath).size;
    console.log(
      "📤 Uploading to Abyss.to:",
      fileName,
      `(${(fileSize / 1024 / 1024).toFixed(2)} MB)`
    );

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), {
      filename:    fileName,
      contentType: "video/mp4",
    });

    const uploadUrl = `${this.uploadBaseUrl}/${this.apiKey}`;

    const response = await axios.post(uploadUrl, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength:    Infinity,
      timeout:          1800000, // 30 min
    });

    console.log(
      "✅ Abyss raw response:",
      JSON.stringify(response.data, null, 2)
    );

    const data = response.data;

    // Extract slug from multiple possible response fields
    const rawSlug =
      data.slug      ||
      data.filecode  ||
      data.file_code ||
      data.id        ||
      "";

    // Also try to extract from any embed_url / embed_code in response
    const slug =
      rawSlug ||
      extractAbyssSlug(data.embed_url   || "") ||
      extractAbyssSlug(data.embed_code  || "") ||
      extractAbyssSlug(data.player_url  || "");

    if (!slug) {
      console.error("❌ No slug in response:", data);
      throw new Error("Abyss upload failed: no slug in response");
    }

    const embedUrl = buildEmbedUrl(slug);
    console.log("✅ Resolved slug:", slug, "→", embedUrl);

    return {
      slug,
      filecode:    slug,
      embedUrl,
      rawResponse: data,
    };
  }

  /**
   * Upload video from buffer (writes to temp file first).
   */
  async uploadVideo(fileBuffer, fileName) {
    const tempDir  = os.tmpdir();
    const tempPath = path.join(tempDir, `abyss_${Date.now()}_${fileName}`);

    try {
      fs.writeFileSync(tempPath, fileBuffer);
      return await this.uploadVideoFromPath(tempPath, fileName);
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (e) {
        console.error("⚠️ Temp cleanup error:", e.message);
      }
    }
  }

  /**
   * Get file info from Abyss API.
   */
  async getFileInfo(filecode) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/v1/files/${filecode}`,
        { params: { key: this.apiKey }, timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.log("⚠️ getFileInfo unavailable:", error.message);
      return null;
    }
  }

  /**
   * Get account info.
   */
  async getAccountInfo() {
    const response = await axios.get(`${this.apiBaseUrl}/v1/about`, {
      params:  { key: this.apiKey },
      timeout: 10000,
    });
    return response.data;
  }

  /**
   * Get file list from Abyss (pageToken-based pagination).
   */
  async getFileList(page = 1, perPage = 50) {
    try {
      let pageToken   = null;
      let currentPage = 0;

      while (true) {
        const params = {
          key:        this.apiKey,
          type:       "files",
          maxResults: perPage,
          orderBy:    "createdAt:desc",
        };
        if (pageToken) params.pageToken = pageToken;

        const response = await axios.get(
          `${this.apiBaseUrl}/v1/resources`,
          { params, timeout: 15000 }
        );

        const data  = response.data;
        const items = (data.items || []).filter((item) => !item.isDir);

        currentPage++;

        if (currentPage === page) {
          const files = items.map((item) => {
            const slug = item.id;
            return {
              file_code: slug,
              filecode:  slug,
              slug,
              title:     (item.name || slug).replace(
                /\.(mp4|mkv|avi|mov|webm|flv|3gp)$/i,
                ""
              ),
              name:      item.name || slug,
              size:      item.size || 0,
              status:    item.status || "ready",
              views:     0,
              created:   item.createdAt,
              embedUrl:  buildEmbedUrl(slug),
              // Thumbnail still served from abyss.to CDN
              thumbnail: `https://abyss.to/splash/${slug}.jpg`,
            };
          });

          return {
            result: { files, total: files.length },
            files,
          };
        }

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
   * Convert seconds to duration string.
   */
  secondsToDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const pad  = (n) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${hrs}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  }
}

module.exports = new AbyssService();