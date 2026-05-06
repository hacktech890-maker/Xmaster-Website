// src/utils/helpers.js
// UPDATED: Deduplicated + new utilities added
// Single source of truth — import from here, do not inline in components

// ============================================================
// NUMBER FORMATTING
// ============================================================

/**
 * Format view count: 1234567 → "1.2M views"
 */
export const formatViews = (views) => {
  if (!views && views !== 0) return '0 views';
  const n = Number(views);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
};

/**
 * Format short view count: 1234567 → "1.2M"
 */
export const formatViewsShort = (views) => {
  if (!views && views !== 0) return '0';
  const n = Number(views);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

/**
 * Format file size: 1073741824 → "1.0 GB"
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// ============================================================
// DATE FORMATTING
// ============================================================

/**
 * Format relative date: "2 days ago", "3 months ago"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60)              return 'Just now';
  if (diff < 3600)            return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)           return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)          return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000)         return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000)        return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

/**
 * Format absolute date: "Jan 15, 2025"
 */
export const formatDateAbsolute = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Format full datetime: "Jan 15, 2025 at 3:42 PM"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ============================================================
// DURATION FORMATTING
// ============================================================

/**
 * Format duration string or seconds → "MM:SS" or "HH:MM:SS"
 * Handles: "1234" (seconds) | "12:34" (already formatted) | number
 */
export const formatDuration = (input) => {
  if (!input && input !== 0) return '';

  // Already formatted (contains colon)
  if (typeof input === 'string' && input.includes(':')) return input;

  const totalSeconds = parseInt(input, 10);
  if (isNaN(totalSeconds)) return String(input);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
};

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Generate URL slug: "Hello World! 123" → "hello-world-123"
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

// ============================================================
// THUMBNAIL UTILITIES
// ============================================================

// Base64 SVG placeholder for failed thumbnails
const PLACEHOLDER_SVG = `data:image/svg+xml;base64,${btoa(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
    <rect width="320" height="180" fill="#1a1a1a"/>
    <circle cx="160" cy="90" r="30" fill="#2a2a2a"/>
    <polygon points="150,75 180,90 150,105" fill="#e11d48" opacity="0.8"/>
    <text x="160" y="145" font-family="Inter,sans-serif" font-size="12"
          fill="#555" text-anchor="middle">No Preview</text>
  </svg>
`)}`;

/**
 * Get thumbnail URL with abyss.to fallback chain
 * Single source of truth — was duplicated in VideoCard + WatchPage
 */
export const getThumbnailUrl = (video) => {
  if (!video) return PLACEHOLDER_SVG;

  // 1. Direct HTTP thumbnail URL
  if (video.thumbnail && video.thumbnail.startsWith('http')) {
    return video.thumbnail;
  }

  // 2. abyss.to splash from thumbnail code
  if (video.thumbnail && video.thumbnail.length > 3) {
    return `https://abyss.to/splash/${video.thumbnail}.jpg`;
  }

  // 3. abyss.to splash from file_code
  if (video.file_code) {
    return `https://abyss.to/splash/${video.file_code}.jpg`;
  }

  // 4. SVG placeholder
  return PLACEHOLDER_SVG;
};

// ============================================================
// FUNCTIONAL UTILITIES
// ============================================================

/**
 * Debounce function
 */
export const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};

/**
 * Generate unique session ID for view tracking
 */
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('xmaster_session');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('xmaster_session', sessionId);
  }
  return sessionId;
};

/**
 * Build watch URL with SEO slug
 */
export const getWatchUrl = (video) => {
  if (!video?._id) return '/';
  const slug = video.slug || generateSlug(video.title || '');
  return slug ? `/watch/${video._id}/${slug}` : `/watch/${video._id}`;
};

/**
 * Check if disclaimer has been accepted
 */
export const isDisclaimerAccepted = () => {
  const accepted = localStorage.getItem('xmaster_age_verified');
  if (!accepted) return false;
  // Re-show after 30 days
  const acceptedAt = parseInt(accepted, 10);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - acceptedAt < thirtyDays;
};

/**
 * Mark disclaimer as accepted
 */
export const acceptDisclaimer = () => {
  localStorage.setItem('xmaster_age_verified', Date.now().toString());
};