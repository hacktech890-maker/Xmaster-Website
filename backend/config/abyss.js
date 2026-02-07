const axios = require('axios');
const FormData = require('form-data');

const ABYSS_API_KEY = process.env.ABYSS_API_KEY || '2ce5472bb6faa900b747eeaf65012a18';
const ABYSS_API_BASE = 'https://api.abyss.to';

class AbyssService {
  constructor() {
    this.apiKey = ABYSS_API_KEY;
    this.baseUrl = ABYSS_API_BASE;
  }

  /**
   * Upload video to Abyss.to
   * Returns: { filecode, slug, embedUrl, downloadUrl, thumbnail }
   */
  async uploadVideo(fileBuffer, fileName) {
    try {
      const formData = new FormData();
      formData.append('api_key', this.apiKey);
      formData.append('file', fileBuffer, fileName);

      const response = await axios.post(
        `${this.baseUrl}/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (!response.data || !response.data.id) {
        throw new Error('Invalid Abyss.to API response');
      }

      const filecode = response.data.id;
      const slug = response.data.slug || '';
      
      // CRITICAL FIX: Use short.icu embed URL format
      const embedUrl = slug 
        ? `https://short.icu/${slug}` 
        : `https://abyss.to/embed/${filecode}`;
      
      const downloadUrl = `https://abyss.to/${filecode}`;
      const thumbnail = response.data.splash_img || `https://abyss.to/splash/${filecode}.jpg`;

      return {
        filecode,
        slug,
        embedUrl,      // https://short.icu/zmPiVIl7y
        downloadUrl,   // https://abyss.to/filecode
        thumbnail,     // Abyss thumbnail URL
        rawResponse: response.data
      };

    } catch (error) {
      console.error('Abyss upload error:', error.response?.data || error.message);
      throw new Error(`Abyss.to upload failed: ${error.message}`);
    }
  }

  /**
   * Get file info from Abyss.to
   */
  async getFileInfo(filecode) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/file/info`,
        {
          params: {
            api_key: this.apiKey,
            file_code: filecode
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Abyss file info error:', error.message);
      throw error;
    }
  }

  /**
   * Get account info / quota
   */
  async getAccountInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/account/info`,
        {
          params: {
            api_key: this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Abyss account info error:', error.message);
      throw error;
    }
  }
}

module.exports = new AbyssService();
