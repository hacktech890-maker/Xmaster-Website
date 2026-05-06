// src/utils/performance.js
// Performance utilities: preloading, caching, optimization helpers

// ============================================================
// IMAGE PRELOADER
// ============================================================

/**
 * Preload a list of image URLs
 * Call this for thumbnails that will appear soon
 */
export const preloadImages = (urls = []) => {
  if (!urls?.length) return;
  urls.forEach((url) => {
    if (!url || typeof url !== 'string') return;
    const img = new Image();
    img.src = url;
  });
};

/**
 * Preload next page thumbnails
 * Call when user is near the bottom of a grid
 */
export const preloadNextPageThumbnails = (videos = []) => {
  const urls = videos
    .slice(0, 8)
    .map((v) => {
      if (v.thumbnail?.startsWith('http')) return v.thumbnail;
      if (v.file_code) return `https://abyss.to/splash/${v.file_code}.jpg`;
      return null;
    })
    .filter(Boolean);
  preloadImages(urls);
};

// ============================================================
// DNS PREFETCH INJECTION
// ============================================================

/**
 * Dynamically inject DNS prefetch / preconnect hints
 * Called once on app boot for domains not in index.html
 */
export const injectDNSPrefetch = (domains = []) => {
  domains.forEach((domain) => {
    // Check if already exists
    const exists = document.querySelector(`link[href="${domain}"]`);
    if (exists) return;

    const link = document.createElement('link');
    link.rel  = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// ============================================================
// RESOURCE HINTS
// ============================================================

export const PREFETCH_DOMAINS = [
  'https://abyss.to',
  'https://api.xmaster.guru',
  'https://www.highperformanceformat.com',
  'https://effectivegatecpm.com',
];

// ============================================================
// LAZY COMPONENT WRAPPER
// ============================================================

/**
 * Creates a wrapper that delays rendering until idle
 * Useful for below-fold content
 */
export const scheduleIdleWork = (fn, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(fn, { timeout });
  }
  return setTimeout(fn, 200);
};

// ============================================================
// MEMORY CACHE — Simple in-memory API response cache
// ============================================================

class SimpleCache {
  constructor(ttlMs = 60000) {
    this.cache = new Map();
    this.ttl   = ttlMs;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Singleton caches
export const videoCache    = new SimpleCache(2 * 60 * 1000);   // 2 min
export const categoryCache = new SimpleCache(5 * 60 * 1000);   // 5 min
export const tagCache      = new SimpleCache(10 * 60 * 1000);  // 10 min

// ============================================================
// WEB VITALS LOGGER (dev only)
// ============================================================

export const logWebVitals = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Log LCP
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      console.log(`[Perf] ${entry.entryType}:`, entry.startTime.toFixed(0), 'ms');
    });
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  } catch {
    // Not all browsers support all entry types
  }
};

// ============================================================
// BUNDLE SIZE HELPERS
// ============================================================

/**
 * Dynamic import with retry
 * Handles Cloudflare Pages chunk loading failures
 */
export const importWithRetry = (importFn, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      importFn()
        .then(resolve)
        .catch((err) => {
          if (n <= 0) {
            reject(err);
            return;
          }
          setTimeout(() => attempt(n - 1), 1000 * (retries - n + 1));
        });
    };
    attempt(retries);
  });
};