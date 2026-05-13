// src/utils/helpers.js
// UPDATED: Full AbyssPlayer support + backward compat with old URLs

// ============================================================
// NUMBER FORMATTING
// ============================================================

export const formatViews = (views) => {
  if (!views && views !== 0) return '0 views';
  const n = Number(views);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
};

export const formatViewsShort = (views) => {
  if (!views && views !== 0) return '0';
  const n = Number(views);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// ============================================================
// DATE FORMATTING
// ============================================================

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60)       return 'Just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000)  return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

export const formatDateAbsolute = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

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

export const formatDuration = (input) => {
  if (!input && input !== 0) return '';
  if (typeof input === 'string' && input.includes(':')) return input;
  const totalSeconds = parseInt(input, 10);
  if (isNaN(totalSeconds)) return String(input);
  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const s   = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// ============================================================
// ABYSS URL UTILITIES
// ============================================================

const ABYSS_PLAYER_BASE = 'https://abyssplayer.com';

const OLD_ABYSS_HOSTS = [
  'short.icu',
  'short.ink',
  'abyss.to',
  'www.abyss.to',
  'abyssplayer.com',
  'www.abyssplayer.com',
];

/**
 * Extract the raw Abyss slug from any supported input:
 *   - https://abyssplayer.com/A74YgdC0_
 *   - https://short.icu/A74YgdC0_
 *   - https://short.ink/A74YgdC0_
 *   - https://abyss.to/A74YgdC0_
 *   - <iframe src="https://abyssplayer.com/A74YgdC0_">...</iframe>
 *   - A74YgdC0_  (raw slug)
 *
 * @param {string} input
 * @returns {string|null}
 */
export const extractAbyssSlug = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // 1. Extract src from iframe HTML
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) return extractAbyssSlug(iframeMatch[1]);

  // 2. Try URL parsing
  try {
    let urlStr = trimmed;
    if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;

    const parsed   = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    const isKnown = OLD_ABYSS_HOSTS.some(
      (h) => hostname === h || hostname.endsWith('.' + h)
    );

    if (isKnown) {
      const slug = parsed.pathname
        .replace(/^\//, '')
        .split('?')[0]
        .split('/')[0];
      return slug || null;
    }
  } catch {
    // Not a URL — fall through
  }

  // 3. Raw slug: alphanumeric + underscore/dash, 4–40 chars
  if (/^[A-Za-z0-9_\-]{4,40}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Normalize any Abyss URL / slug / iframe HTML to the canonical
 * https://abyssplayer.com/{slug} embed URL.
 *
 * Returns empty string if slug cannot be extracted.
 *
 * @param {string} input
 * @returns {string}
 */
export const normalizeAbyssUrl = (input) => {
  const slug = extractAbyssSlug(input);
  return slug ? `${ABYSS_PLAYER_BASE}/${slug}` : '';
};

/**
 * Get the canonical embed URL for a video object.
 * Handles:
 *   - New format (video.embedUrl already set to abyssplayer.com)
 *   - New abyssSlug field
 *   - Legacy embed_code / embedUrl in old formats
 *   - file_code as fallback
 *
 * This is the ONLY function that should build embed URLs in the frontend.
 *
 * @param {object} video  - Video document from API
 * @returns {string}      - Safe https://abyssplayer.com/... URL
 */
export const getEmbedUrl = (video) => {
  if (!video) return '';

  // 1. Already correct new format
  if (video.embedUrl && video.embedUrl.includes('abyssplayer.com')) {
    return video.embedUrl;
  }

  // 2. abyssSlug field (new schema)
  if (video.abyssSlug) {
    return `${ABYSS_PLAYER_BASE}/${video.abyssSlug}`;
  }

  // 3. Normalize embedUrl (might be old format)
  if (video.embedUrl) {
    const normalized = normalizeAbyssUrl(video.embedUrl);
    if (normalized) return normalized;
  }

  // 4. Legacy embed_code field
  if (video.embed_code) {
    const normalized = normalizeAbyssUrl(video.embed_code);
    if (normalized) return normalized;
  }

  // 5. Fall back to file_code
  if (video.file_code) {
    return `${ABYSS_PLAYER_BASE}/${video.file_code}`;
  }

  return '';
};

// ============================================================
// STRING UTILITIES
// ============================================================

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

export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

export const titleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

// ============================================================
// THUMBNAIL UTILITIES
// ============================================================

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
 * Get thumbnail URL for a video.
 * Priority:
 *   1. Direct HTTP URL (Cloudinary or external)
 *   2. abyss.to splash from thumbnail code
 *   3. abyss.to splash from file_code / abyssSlug
 *   4. SVG placeholder
 *
 * @param {object} video
 * @returns {string}
 */
export const getThumbnailUrl = (video) => {
  if (!video) return PLACEHOLDER_SVG;

  // 1. thumbnailUrl (Cloudinary preferred)
  if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
    return video.thumbnailUrl;
  }

  // 2. thumbnail as direct HTTP URL (Cloudinary)
  if (video.thumbnail && video.thumbnail.startsWith('http')) {
    return video.thumbnail;
  }

  // 3. thumbnail as a short code → abyss.to splash
  if (video.thumbnail && video.thumbnail.length > 3) {
    return `https://abyss.to/splash/${video.thumbnail}.jpg`;
  }

  // 4. abyssSlug → abyss.to splash
  if (video.abyssSlug) {
    return `https://abyss.to/splash/${video.abyssSlug}.jpg`;
  }

  // 5. file_code → abyss.to splash
  if (video.file_code) {
    return `https://abyss.to/splash/${video.file_code}.jpg`;
  }

  return PLACEHOLDER_SVG;
};

// ============================================================
// FUNCTIONAL UTILITIES
// ============================================================

export const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};

export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('xmaster_session');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('xmaster_session', sessionId);
  }
  return sessionId;
};

export const getWatchUrl = (video) => {
  if (!video?._id) return '/';
  const slug = video.slug || generateSlug(video.title || '');
  return slug ? `/watch/${video._id}/${slug}` : `/watch/${video._id}`;
};

export const isDisclaimerAccepted = () => {
  const accepted = localStorage.getItem('xmaster_age_verified');
  if (!accepted) return false;
  const acceptedAt = parseInt(accepted, 10);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - acceptedAt < thirtyDays;
};

export const acceptDisclaimer = () => {
  localStorage.setItem('xmaster_age_verified', Date.now().toString());
};