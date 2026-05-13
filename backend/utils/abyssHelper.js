/**
 * backend/utils/abyssHelper.js
 *
 * Shared utility for extracting Abyss slugs from any input format
 * and building canonical AbyssPlayer embed URLs.
 *
 * Supports:
 *   https://abyssplayer.com/A74YgdC0_
 *   https://short.icu/A74YgdC0_
 *   https://short.ink/A74YgdC0_
 *   https://abyss.to/A74YgdC0_
 *   <iframe src="https://abyssplayer.com/A74YgdC0_"></iframe>
 *   A74YgdC0_   (raw slug)
 */

const ABYSS_PLAYER_BASE = "https://abyssplayer.com";

const OLD_HOSTS = [
  "short.icu",
  "short.ink",
  "abyss.to",
  "www.abyss.to",
  "abyssplayer.com",
  "www.abyssplayer.com",
];

/**
 * Extract the Abyss slug from any supported input.
 *
 * @param {string} input - URL, iframe HTML, or raw slug
 * @returns {string|null} - The slug, or null if not found
 */
function extractAbyssSlug(input) {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // ── 1. Extract src from iframe HTML ──────────────────────
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    return extractAbyssSlug(iframeSrcMatch[1]);
  }

  // ── 2. Parse as URL ───────────────────────────────────────
  try {
    let urlStr = trimmed;
    if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;

    const parsed   = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    const isKnownHost = OLD_HOSTS.some(
      (h) => hostname === h || hostname.endsWith("." + h)
    );

    if (isKnownHost) {
      // pathname = "/A74YgdC0_" → slug = "A74YgdC0_"
      const slug = parsed.pathname.replace(/^\//, "").split("?")[0].split("/")[0];
      return slug || null;
    }
  } catch {
    // Not a URL — fall through to raw slug check
  }

  // ── 3. Raw slug (alphanumeric + underscore/dash, 4–40 chars) ─
  if (/^[A-Za-z0-9_\-]{4,40}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Build the canonical AbyssPlayer embed URL from a slug.
 *
 * @param {string} slug
 * @returns {string}
 */
function buildEmbedUrl(slug) {
  if (!slug) return "";
  return `${ABYSS_PLAYER_BASE}/${slug}`;
}

/**
 * Normalize any Abyss URL/slug/iframe to the canonical embed URL.
 *
 * @param {string} input
 * @returns {string} - canonical URL or empty string
 */
function normalizeAbyssUrl(input) {
  const slug = extractAbyssSlug(input);
  return slug ? buildEmbedUrl(slug) : "";
}

/**
 * Validate that a URL is a safe AbyssPlayer embed URL.
 * Only https://abyssplayer.com/* is trusted for iframes.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isSafeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "abyssplayer.com" ||
        parsed.hostname === "www.abyssplayer.com")
    );
  } catch {
    return false;
  }
}

module.exports = {
  extractAbyssSlug,
  buildEmbedUrl,
  normalizeAbyssUrl,
  isSafeEmbedUrl,
  ABYSS_PLAYER_BASE,
};