import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "https://api.xmaster.guru/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/xmaster-admin';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== PUBLIC API ====================
export const publicAPI = {
  getHomeData: () => api.get('/public/home'),
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  getLatestVideos: (limit = 12) => api.get('/videos/latest', { params: { limit } }),
  getTrendingVideos: (limit = 12, period = '7d') =>
    api.get('/videos/trending', { params: { limit, period } }),
  getFeaturedVideos: (limit = 6) => api.get('/videos/featured', { params: { limit } }),

  // UPDATED: Added seed parameter for random results on each call
  getRelatedVideos: (id, limit = 10) =>
    api.get(`/videos/${id}/related`, { params: { limit, seed: Date.now() } }),

  getRandomVideos: (limit = 10, exclude = '') =>
    api.get('/videos/random', { params: { limit, exclude } }),

  recordView: (id, sessionId) => api.post(`/videos/${id}/view`, { sessionId }),
  likeVideo: (id) => api.post(`/videos/${id}/like`),
  dislikeVideo: (id) => api.post(`/videos/${id}/dislike`),
  reportVideo: (id, data) => api.post(`/videos/${id}/report`, data),
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),
  getCategoryVideos: (slug, params) => api.get(`/categories/${slug}/videos`, { params }),
  searchVideos: (params) => api.get('/search', { params }),
  getSearchSuggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  searchByTag: (tag, params) => api.get(`/search/tags/${tag}`, { params }),
  getPopularTags: (limit = 20) => api.get('/search/popular-tags', { params: { limit } }),
  getAds: (device = 'desktop') => api.get('/ads', { params: { device } }),
  getAdByPlacement: (placement, device = 'desktop') =>
    api.get(`/ads/placement/${placement}`, { params: { device } }),
  recordAdImpression: (id) => api.post(`/ads/${id}/impression`),
  recordAdClick: (id) => api.post(`/ads/${id}/click`),
  getPublicStats: () => api.get('/public/stats'),
  getPublicComments: (page = 1, limit = 20) =>
    api.get('/comments/public', { params: { page, limit } }),
  submitComment: (data) => api.post('/comments', data),
  trackShare: (id, platform) => api.post(`/public/share/${id}/track`, { platform }),
  getShareDebug: (id) => api.get(`/public/share/${id}/debug`),
  bulkCreateCategories: (data) => api.post('/categories/bulk-create', data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Auth
  login: (password, username = 'admin') =>
    api.post('/admin/login', { password, username }),
  verifyToken: () => api.post('/admin/verify'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/admin/change-password', { currentPassword, newPassword }),

  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Videos
  getVideos: (params) => api.get('/admin/videos', { params }),
  getVideo: (id) => api.get(`/admin/videos/${id}`),
  updateVideo: (id, data) => api.put(`/admin/videos/${id}`, data),
  deleteVideo: (id) => api.delete(`/admin/videos/${id}`),
  bulkDeleteVideos: (ids) => api.post('/admin/videos/bulk-delete', { ids }),
  toggleFeatured: (id) => api.put(`/admin/videos/${id}/feature`),
  updateVideoStatus: (id, status) => api.put(`/admin/videos/${id}/status`, { status }),

  // Bulk Operations
  bulkUpdateTitles: (updates) => api.post('/admin/videos/bulk-update-titles', { updates }),
  bulkUpdateTags: (updates) => api.post('/admin/videos/bulk-update-tags', { updates }),
  bulkShareLinks: (data) => api.post('/admin/videos/bulk-share-links', data),
  bulkUpdateStatus: (data) => api.post('/admin/videos/bulk-update-status', data),
  exportVideos: (params) => api.get('/admin/videos/export', { params }),
  exportVideosCSV: (ids) => api.get('/admin/videos/export', {
    params: { format: 'csv', ids: ids ? ids.join(',') : undefined },
    responseType: 'blob',
  }),

  // Upload
  uploadVideo: (formData, onProgress) =>
    api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent, e.loaded, e.total);
        }
      },
    }),
  addByFileCode: (data) => api.post('/upload/file-code', data),
  bulkAddFileCodes: (videos) => api.post('/upload/bulk-file-codes', { videos }),
  uploadThumbnail: (formData) =>
    api.post('/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remoteUpload: (url, title, category, tags) =>
    api.post('/upload/url', { url, title, category, tags }),
  getAbyssFiles: (page = 1, limit = 50) =>
    api.get('/upload/abyss-files', { params: { page, limit } }),
  getAccountInfo: () => api.get('/upload/account-info'),

  // Categories
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  bulkCreateCategories: (data) => api.post('/categories/bulk-create', data),
  reorderCategories: (order) => api.put('/categories/admin/reorder', { order }),

  // Ads
  getAllAds: () => api.get('/ads/admin/all'),
  getAdPlacements: () => api.get('/ads/admin/placements'),
  createAd: (data) => api.post('/ads', data),
  updateAd: (id, data) => api.put(`/ads/${id}`, data),
  deleteAd: (id) => api.delete(`/ads/${id}`),
  toggleAd: (id) => api.put(`/ads/${id}/toggle`),

  // Analytics
  getAnalyticsDashboard: () => api.get('/analytics/dashboard'),
  getViewAnalytics: (period = '7d') => api.get('/analytics/views', { params: { period } }),
  getTopVideos: (limit = 10, period = '7d') =>
    api.get('/analytics/top-videos', { params: { limit, period } }),
  getCategoryAnalytics: () => api.get('/analytics/categories'),
  getAdAnalytics: () => api.get('/analytics/ads'),

  // Reports
  getReports: (params) => api.get('/analytics/reports', { params }),
  updateReport: (id, data) => api.put(`/analytics/reports/${id}`, data),

  // Comments
  getComments: (params) => api.get('/comments/admin', { params }),
  toggleCommentVisibility: (id) => api.put(`/comments/${id}/toggle-visibility`),
  markCommentRead: (id) => api.put(`/comments/${id}/read`),
  addCommentNote: (id, note) => api.put(`/comments/${id}/note`, { note }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  bulkDeleteComments: (ids) => api.post('/comments/bulk-delete', { ids }),

  // Duplicates
  getDuplicates: (params) => api.get('/duplicates', { params }),
  scanDuplicates: () => api.post('/duplicates/scan'),
  checkDuplicate: (data) => api.post('/duplicates/check', data),
  keepDuplicate: (id) => api.put(`/duplicates/${id}/keep`),
  makePublicDuplicate: (id) => api.put(`/duplicates/${id}/make-public`),
  deleteDuplicate: (id) => api.delete(`/duplicates/${id}`),
  bulkDeleteDuplicates: (ids) => api.post('/duplicates/bulk-delete', { ids }),
  clearAllDuplicates: () => api.post('/duplicates/clear-all'),
};

export default api;