// backend/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Video = require('../models/Video');
const Category = require('../models/Category');

// ==========================================
// CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dzjw6z7fy';
const SITE_NAME = 'Xmaster';
const DEFAULT_DESCRIPTION = 'Watch Videos Online on Xmaster';

// ==========================================
// HELPERS
// ==========================================

function getFrontendUrl() {
  var raw = process.env.FRONTEND_URL || 'https://xmaster.guru';
  if (raw.indexOf(',') !== -1) {
    raw = raw.split(',')[0].trim();
  }
  return raw.replace(/\/+$/, '');
}

function getBackendUrl() {
  var raw = process.env.BACKEND_URL || 'https://api.xmaster.guru';
  return raw.replace(/\/+$/, '');
}

/**
 * Build the BEST possible thumbnail URL for Telegram
 * 
 * ALWAYS use the proxy endpoint because:
 * 1. Guarantees correct Content-Type header (image/jpeg)
 * 2. No redirects (Telegram hates redirects)
 * 3. Guaranteed HTTPS
 * 4. URL ends with .jpg (Telegram likes this)
 * 5. Serves a big enough image for large preview card
 * 6. Single consistent URL format for all videos
 */
function getTelegramOptimizedThumbnail(video) {
  var backendUrl = getBackendUrl();
  return backendUrl + '/api/public/thumb/' + video._id + '.jpg';
}

/**
 * Get the SOURCE thumbnail URL from Cloudinary or other sources
 * Used internally by the proxy endpoint
 */
function getSourceThumbnailUrl(video) {
  if (video.cloudinary_public_id) {
    return 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
      '/image/upload/w_1280,h_720,c_fill,q_90,f_jpg/' +
      video.cloudinary_public_id + '.jpg';
  }
  if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
    if (video.thumbnailUrl.indexOf('cloudinary') !== -1) {
      return video.thumbnailUrl.replace(
        '/upload/',
        '/upload/w_1280,h_720,c_fill,q_90,f_jpg/'
      );
    }
    return video.thumbnailUrl;
  }
  if (video.thumbnail && video.thumbnail.startsWith('http')) {
    if (video.thumbnail.indexOf('cloudinary') !== -1) {
      return video.thumbnail.replace(
        '/upload/',
        '/upload/w_1280,h_720,c_fill,q_90,f_jpg/'
      );
    }
    return video.thumbnail;
  }
  if (video.file_code) {
    return 'https://abyss.to/splash/' + video.file_code + '.jpg';
  }
  return '';
}

/**
 * Detect social media crawler bots
 */
function isCrawlerBot(userAgent) {
  if (!userAgent) return false;
  var ua = userAgent.toLowerCase();
  var bots = [
    'telegrambot',
    'twitterbot',
    'facebookexternalhit',
    'facebot',
    'whatsapp',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'skypeuripreview',
    'viber',
    'vkshare',
    'pinterest',
    'embedly',
    'quora link preview',
    'redditbot',
    'applebot',
    'bingpreview',
    'googlebot',
    'yandexbot',
    'baiduspider',
    'seznambot',
  ];
  for (var i = 0; i < bots.length; i++) {
    if (ua.indexOf(bots[i]) !== -1) return true;
  }
  return false;
}

/**
 * Detect specifically Telegram bot
 */
function isTelegramBot(userAgent) {
  if (!userAgent) return false;
  return userAgent.toLowerCase().indexOf('telegrambot') !== -1;
}

/**
 * Escape string for safe HTML attribute insertion
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Clean and truncate description
 */
function cleanDescription(video) {
  var desc = video.description || '';
  if (!desc || desc.trim().length < 10) {
    desc = 'Watch ' + (video.title || 'this video') + ' on ' + SITE_NAME;
  }
  desc = desc.replace(/<[^>]*>/g, '');
  if (desc.length > 200) {
    desc = desc.substring(0, 197) + '...';
  }
  return desc;
}

/**
 * Format view count
 */
function formatViews(views) {
  if (!views || views === 0) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
}

// ==========================================
// SHARE PAGE - THE CRITICAL ENDPOINT
// ==========================================

router.get('/share/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.redirect(getFrontendUrl());
    }

    var video = await Video.findById(req.params.id);
    if (!video) {
      return res.redirect(getFrontendUrl());
    }

    var frontendUrl = getFrontendUrl();
    var videoPageUrl = frontendUrl + '/watch/' + video._id;
    if (video.slug) {
      videoPageUrl += '/' + encodeURIComponent(video.slug);
    }

    var thumbnail = getTelegramOptimizedThumbnail(video);
    var title = escapeHtml(video.title || 'Video');
    var description = escapeHtml(cleanDescription(video));
    var views = video.views || 0;
    var duration = video.duration || '';
    var userAgent = req.headers['user-agent'] || '';
    var botRequest = isCrawlerBot(userAgent);
    var sharePageUrl = getBackendUrl() + '/api/public/share/' + video._id;

    var html = '<!DOCTYPE html>\n';
    html += '<html lang="en" prefix="og: http://ogp.me/ns#">\n';
    html += '<head>\n';
    html += '<meta charset="utf-8" />\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1" />\n';
    html += '<title>' + title + ' - ' + SITE_NAME + '</title>\n\n';

    // OG tags - same for bot and human
    html += '<meta property="og:type" content="article" />\n';
    html += '<meta property="og:title" content="' + title + '" />\n';
    html += '<meta property="og:description" content="' + description + '" />\n';
    html += '<meta property="og:url" content="' + sharePageUrl + '" />\n';
    html += '<meta property="og:site_name" content="' + SITE_NAME + '" />\n';
    html += '<meta property="og:locale" content="en_US" />\n';
    if (thumbnail) {
      html += '<meta property="og:image" content="' + thumbnail + '" />\n';
      html += '<meta property="og:image:secure_url" content="' + thumbnail + '" />\n';
      html += '<meta property="og:image:type" content="image/jpeg" />\n';
      html += '<meta property="og:image:width" content="1280" />\n';
      html += '<meta property="og:image:height" content="720" />\n';
      html += '<meta property="og:image:alt" content="' + title + '" />\n';
    }
    html += '<meta name="twitter:card" content="summary_large_image" />\n';
    html += '<meta name="twitter:title" content="' + title + '" />\n';
    html += '<meta name="twitter:description" content="' + description + '" />\n';
    if (thumbnail) {
      html += '<meta name="twitter:image" content="' + thumbnail + '" />\n';
    }
    html += '<meta name="description" content="' + description + '" />\n';
    html += '<link rel="canonical" href="' + sharePageUrl + '" />\n';
    if (thumbnail) {
      html += '<link rel="image_src" href="' + thumbnail + '" />\n';
    }
    html += '<meta name="robots" content="index, follow" />\n';

    if (botRequest) {
      html += '</head>\n<body>\n';
      html += '<h1>' + title + '</h1>\n';
      if (thumbnail) {
        html += '<img src="' + thumbnail + '" alt="' + title + '" width="1280" height="720" />\n';
      }
      html += '<p>' + description + '</p>\n';
      if (duration) html += '<p>Duration: ' + duration + '</p>\n';
      html += '<p>Views: ' + formatViews(views) + '</p>\n';
      html += '<a href="' + videoPageUrl + '">Watch on ' + SITE_NAME + '</a>\n';
      html += '</body></html>';
    } else {
      html += '<style>\n';
      html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
      html += 'body { background: #0a0a0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }\n';
      html += '.container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }\n';
      html += '.card { max-width: 420px; width: 100%; }\n';
      html += '.thumb-wrap { position: relative; width: 100%; border-radius: 16px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }\n';
      html += '.thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }\n';
      html += '.play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }\n';
      html += '.play-btn { width: 72px; height: 72px; background: rgba(255,255,255,0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }\n';
      html += '.play-btn svg { width: 32px; height: 32px; margin-left: 4px; }\n';
      html += '.duration-badge { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.85); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }\n';
      html += '.title { font-size: 18px; font-weight: 700; line-height: 1.4; margin-bottom: 6px; }\n';
      html += '.meta { color: #888; font-size: 13px; margin-bottom: 20px; }\n';

      // Copy link section styles
      html += '.link-section { margin-bottom: 16px; }\n';
      html += '.link-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }\n';
      html += '.link-box { display: flex; align-items: center; background: #1a1a2e; border: 2px solid #2a2a4a; border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }\n';
      html += '.link-box.copied { border-color: #22c55e; }\n';
      html += '.link-input { flex: 1; background: none; border: none; color: #ccc; padding: 14px; font-size: 13px; outline: none; font-family: monospace; }\n';
      html += '.copy-btn { padding: 14px 20px; background: #3b82f6; color: #fff; border: none; font-weight: 700; font-size: 14px; cursor: pointer; transition: background 0.15s; white-space: nowrap; }\n';
      html += '.copy-btn:active { background: #2563eb; }\n';
      html += '.copy-btn.copied { background: #22c55e; }\n';

      // Watch here button
      html += '.watch-btn { display: block; width: 100%; padding: 16px; background: linear-gradient(135deg, #e50914, #b20710); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 17px; text-align: center; box-shadow: 0 4px 20px rgba(229,9,20,0.4); margin-bottom: 16px; }\n';
      html += '.watch-btn:active { transform: scale(0.98); }\n';

      // How to open guide
      html += '.guide { background: #111122; border: 1px solid #1e1e3a; border-radius: 14px; padding: 18px; margin-bottom: 16px; }\n';
      html += '.guide-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; color: #60a5fa; display: flex; align-items: center; gap: 8px; }\n';
      html += '.step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }\n';
      html += '.step:last-child { margin-bottom: 0; }\n';
      html += '.step-num { width: 26px; height: 26px; background: #e50914; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; flex-shrink: 0; }\n';
      html += '.step-text { font-size: 13px; color: #bbb; line-height: 1.5; padding-top: 2px; }\n';
      html += '.step-text strong { color: #fff; }\n';

      // Screenshot hint
      html += '.hint-img { margin-top: 12px; padding: 12px; background: rgba(229,9,20,0.08); border: 1px dashed rgba(229,9,20,0.3); border-radius: 10px; text-align: center; }\n';
      html += '.hint-img p { font-size: 28px; margin-bottom: 4px; }\n';
      html += '.hint-img span { font-size: 11px; color: #e55; font-weight: 600; }\n';

      html += '.footer { text-align: center; padding: 12px; color: #333; font-size: 10px; }\n';
      html += '.copied-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #fff; padding: 12px 28px; border-radius: 30px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 20px rgba(34,197,94,0.4); z-index: 9999; display: none; }\n';
      html += '.copied-toast.show { display: block; animation: slideUp 0.3s ease; }\n';
      html += '@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }\n';
      html += '</style>\n';
      html += '</head>\n<body>\n';

      html += '<div class="container"><div class="card">\n';

      // Thumbnail
      if (thumbnail) {
        html += '<div class="thumb-wrap">\n';
        html += '  <img class="thumb" src="' + thumbnail + '" alt="' + title + '" onerror="this.parentElement.style.display=\'none\'" />\n';
        html += '  <div class="play-overlay"><div class="play-btn"><svg viewBox="0 0 24 24" fill="#e50914"><path d="M8 5v14l11-7z"/></svg></div></div>\n';
        if (duration && duration !== '00:00') {
          html += '  <div class="duration-badge">' + duration + '</div>\n';
        }
        html += '</div>\n';
      }

      // Title and meta
      html += '<div class="title">' + title + '</div>\n';
      html += '<div class="meta">';
      if (duration && duration !== '00:00') html += duration + ' &bull; ';
      html += formatViews(views) + ' views &bull; ' + SITE_NAME + '</div>\n';

      // === WATCH HERE BUTTON (plays in current context) ===
      html += '<a class="watch-btn" href="' + videoPageUrl + '">▶ Watch Video</a>\n';

      // === COPY LINK SECTION ===
      html += '<div class="link-section">\n';
      html += '  <div class="link-label">📋 Copy link &amp; open in browser</div>\n';
      html += '  <div class="link-box" id="link-box">\n';
      html += '    <input class="link-input" id="link-input" type="text" value="' + videoPageUrl + '" readonly />\n';
      html += '    <button class="copy-btn" id="copy-btn" onclick="copyLink()">COPY</button>\n';
      html += '  </div>\n';
      html += '</div>\n';

      // === HOW TO OPEN IN BROWSER GUIDE ===
      html += '<div class="guide">\n';
      html += '  <div class="guide-title">📱 How to open in Chrome / Safari</div>\n';

      html += '  <div class="step"><div class="step-num">1</div><div class="step-text">Tap <strong>COPY</strong> button above</div></div>\n';
      html += '  <div class="step"><div class="step-num">2</div><div class="step-text">Open <strong>Chrome</strong> or <strong>Safari</strong> on your phone</div></div>\n';
      html += '  <div class="step"><div class="step-num">3</div><div class="step-text">Paste the link in address bar &amp; go</div></div>\n';

      html += '  <div class="hint-img">\n';
      html += '    <p>⋮</p>\n';
      html += '    <span>OR tap ⋮ menu above → "Open in Chrome"</span>\n';
      html += '  </div>\n';
      html += '</div>\n';

      html += '</div></div>\n';

      // Copied toast
      html += '<div class="copied-toast" id="toast">✓ Link Copied! Now open your browser</div>\n';

      // Footer
      html += '<div class="footer">' + SITE_NAME + ' &bull; Best experience in Chrome or Safari</div>\n';

      // === JAVASCRIPT ===
      html += '<script>\n';
      html += 'function copyLink() {\n';
      html += '  var url = "' + videoPageUrl + '";\n';
      html += '  var input = document.getElementById("link-input");\n';
      html += '  var btn = document.getElementById("copy-btn");\n';
      html += '  var box = document.getElementById("link-box");\n';
      html += '  var toast = document.getElementById("toast");\n';
      html += '\n';
      html += '  // Try modern clipboard API first\n';
      html += '  if (navigator.clipboard && navigator.clipboard.writeText) {\n';
      html += '    navigator.clipboard.writeText(url).then(function() {\n';
      html += '      showCopied(btn, box, toast);\n';
      html += '    }).catch(function() {\n';
      html += '      fallbackCopy(input, btn, box, toast);\n';
      html += '    });\n';
      html += '  } else {\n';
      html += '    fallbackCopy(input, btn, box, toast);\n';
      html += '  }\n';
      html += '}\n';
      html += '\n';
      html += 'function fallbackCopy(input, btn, box, toast) {\n';
      html += '  input.select();\n';
      html += '  input.setSelectionRange(0, 99999);\n';
      html += '  try {\n';
      html += '    document.execCommand("copy");\n';
      html += '    showCopied(btn, box, toast);\n';
      html += '  } catch(e) {\n';
      html += '    btn.textContent = "SELECT & COPY";\n';
      html += '  }\n';
      html += '}\n';
      html += '\n';
      html += 'function showCopied(btn, box, toast) {\n';
      html += '  btn.textContent = "✓ COPIED!";\n';
      html += '  btn.classList.add("copied");\n';
      html += '  box.classList.add("copied");\n';
      html += '  toast.classList.add("show");\n';
      html += '  setTimeout(function() {\n';
      html += '    btn.textContent = "COPY";\n';
      html += '    btn.classList.remove("copied");\n';
      html += '    box.classList.remove("copied");\n';
      html += '    toast.classList.remove("show");\n';
      html += '  }, 3000);\n';
      html += '}\n';
      html += '\n';
      html += '// Auto-redirect only if in a REAL browser (not in-app)\n';
      html += '(function() {\n';
      html += '  var ua = navigator.userAgent || "";\n';
      html += '  var inApp = /Telegram|FBAN|FBAV|Instagram|Twitter|Line\\/|Snapchat|Viber|WhatsApp|MicroMessenger|wv|WebView/i.test(ua);\n';
      html += '  if (!inApp) {\n';
      html += '    // Real browser — redirect after 5 seconds\n';
      html += '    setTimeout(function() {\n';
      html += '      window.location.replace("' + videoPageUrl + '");\n';
      html += '    }, 5000);\n';
      html += '  }\n';
      html += '  // In-app browser — page stays, user copies link manually\n';
      html += '})();\n';
      html += '</script>\n';
      html += '</body></html>';
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(html);

  } catch (error) {
    console.error('Share page error:', error);
    res.redirect(getFrontendUrl());
  }
});


// ==========================================
// THUMBNAIL PROXY ENDPOINT
// ==========================================
// Serves the actual image to Telegram
// Guarantees: correct headers, big image, no redirects
// URL: /api/public/thumb/{videoId}.jpg
// ==========================================

router.get('/thumb/:idWithExt', async (req, res) => {
  try {
    var videoId = req.params.idWithExt.replace(/\.\w+$/, '');

    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).send('Not found');
    }

    var video = await Video.findById(videoId).lean();
    if (!video) return res.status(404).send('Not found');

    var thumbnailUrl = getSourceThumbnailUrl(video);

    if (!thumbnailUrl) {
      return res.status(404).send('No thumbnail');
    }

    // Fetch the image from source
    var imageResponse = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XmasterBot/1.0)',
        'Accept': 'image/*',
      },
    });

    var imageBuffer = Buffer.from(imageResponse.data);

    // Set all headers Telegram needs
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Thumb proxy error:', error.message);

    // Try fallback: original thumbnail without transforms
    try {
      var fallbackId = req.params.idWithExt.replace(/\.\w+$/, '');
      var video2 = await Video.findById(fallbackId).lean();
      if (video2) {
        var fallbackUrl = '';
        if (video2.thumbnail && video2.thumbnail.startsWith('http')) {
          fallbackUrl = video2.thumbnail;
        } else if (video2.file_code) {
          fallbackUrl = 'https://abyss.to/splash/' + video2.file_code + '.jpg';
        }
        if (fallbackUrl) {
          var fallbackResponse = await axios.get(fallbackUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; XmasterBot/1.0)',
            },
          });
          var fallbackBuffer = Buffer.from(fallbackResponse.data);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Length', fallbackBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=604800');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).send(fallbackBuffer);
        }
      }
    } catch (e2) {
      console.error('Thumb fallback error:', e2.message);
    }

    // Last resort: 1x1 transparent GIF
    var fallback = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.status(200).send(fallback);
  }
});


// ==========================================
// SHARE TRACKING ENDPOINT
// ==========================================

router.post('/share/:id/track', async (req, res) => {
  try {
    var videoId = req.params.id;
    if (!videoId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    var platform = req.body.platform || 'unknown';
    var validPlatforms = ['telegram', 'whatsapp', 'facebook', 'twitter', 'copy', 'native', 'unknown'];
    if (validPlatforms.indexOf(platform) === -1) {
      platform = 'unknown';
    }

    var updateQuery = {
      $inc: {
        shares: 1,
      },
    };
    updateQuery.$inc['sharePlatforms.' + platform] = 1;

    await Video.findByIdAndUpdate(videoId, updateQuery);

    res.json({ success: true });
  } catch (error) {
    console.error('Share tracking error:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});


// ==========================================
// OG DEBUG ENDPOINT
// ==========================================

router.get('/share/:id/debug', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    var video = await Video.findById(req.params.id).lean();
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    var frontendUrl = getFrontendUrl();
    var videoPageUrl = frontendUrl + '/watch/' + video._id;
    if (video.slug) {
      videoPageUrl += '/' + video.slug;
    }

    var thumbnail = getTelegramOptimizedThumbnail(video);
    var sourceThumbnail = getSourceThumbnailUrl(video);

    // Test proxy thumbnail accessibility
    var proxyStatus = 'unknown';
    var proxyContentType = 'unknown';
    var proxySize = 'unknown';
    try {
      var testResponse = await axios.head(thumbnail, {
        timeout: 10000,
        maxRedirects: 0,
      });
      proxyStatus = testResponse.status;
      proxyContentType = testResponse.headers['content-type'] || 'not set';
      proxySize = testResponse.headers['content-length'] || 'not set';
    } catch (e) {
      proxyStatus = 'ERROR: ' + e.message;
    }

    // Test source thumbnail accessibility
    var sourceStatus = 'unknown';
    var sourceSize = 'unknown';
    try {
      var sourceResponse = await axios.head(sourceThumbnail, {
        timeout: 5000,
        maxRedirects: 5,
      });
      sourceStatus = sourceResponse.status;
      sourceSize = sourceResponse.headers['content-length'] || 'not set';
    } catch (e) {
      sourceStatus = 'ERROR: ' + e.message;
    }

    res.json({
      success: true,
      debug: {
        videoId: video._id,
        title: video.title,
        description: cleanDescription(video),
        slug: video.slug,
        videoPageUrl: videoPageUrl,
        shareUrl: getBackendUrl() + '/api/public/share/' + video._id,
        thumbnail: {
          proxy: thumbnail,
          source: sourceThumbnail,
          raw_thumbnail: video.thumbnail || null,
          raw_thumbnailUrl: video.thumbnailUrl || null,
          cloudinary_public_id: video.cloudinary_public_id || null,
          file_code: video.file_code || null,
          proxyStatus: proxyStatus,
          proxyContentType: proxyContentType,
          proxySize: proxySize,
          sourceStatus: sourceStatus,
          sourceSize: sourceSize,
        },
        telegramTest: {
          shareLink: 'https://t.me/share/url?url=' + encodeURIComponent(getBackendUrl() + '/api/public/share/' + video._id),
          webpageBotLink: 'Send this URL to @WebpageBot on Telegram: ' + getBackendUrl() + '/api/public/share/' + video._id,
          cacheBustTest: getBackendUrl() + '/api/public/share/' + video._id + '?v=' + Date.now(),
        },
        checks: {
          hasTitle: !!video.title,
          hasThumbnail: !!thumbnail,
          thumbnailIsHttps: thumbnail ? thumbnail.startsWith('https://') : false,
          thumbnailEndsWithJpg: thumbnail ? thumbnail.endsWith('.jpg') : false,
          hasCloudinaryId: !!video.cloudinary_public_id,
          proxyWorking: proxyStatus === 200,
        },
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', message: error.message });
  }
});


// ==========================================
// HOME DATA - RANDOMIZED
// ==========================================
router.get('/home', async (req, res) => {
  try {
    var query = { status: 'public', isDuplicate: { $ne: true } };

    const featuredVideos = await Video.aggregate([
      { $match: { ...query, featured: true } },
      { $sample: { size: 6 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      { $project: { categoryData: 0 } }
    ]);

    // ✅ FIX: Changed from .limit(12) to .limit(40)
    const latestVideos = await Video.find(query)
      .sort({ uploadDate: -1 })
      .limit(40)
      .populate('category', 'name slug');

    const trendingVideos = await Video.aggregate([
      { $match: query },
      { $sort: { views: -1 } },
      { $limit: 50 },
      { $sample: { size: 12 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      { $project: { categoryData: 0 } }
    ]);

    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).limit(10);

    // ✅ FIX: Also return total count so frontend knows how many exist
    const totalVideos = await Video.countDocuments(query);

    res.json({
      success: true,
      data: {
        featuredVideos,
        latestVideos,
        trendingVideos,
        categories,
        totalVideos  // ✅ Added
      }
    });
  } catch (error) {
    console.error('Home Data Error:', error);
    res.status(500).json({ error: 'Failed to get home data' });
  }
});


// ==========================================
// STATS
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    var query = { status: 'public', isDuplicate: { $ne: true } };

    const [videoCount, totalViews, categoryCount] = await Promise.all([
      Video.countDocuments(query),
      Video.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$views' } } }]),
      Category.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      stats: {
        videos: videoCount,
        views: totalViews[0]?.total || 0,
        categories: categoryCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});


// ==========================================
// DYNAMIC SITEMAP
// ==========================================
// ==========================================
// DYNAMIC SITEMAP - ENHANCED WITH VIDEO MARKUP
// ==========================================
router.get('/sitemap.xml', async (req, res) => {
  try {
    var frontendUrl = getFrontendUrl();
    var today = new Date().toISOString().split('T')[0];

    // Get total video count
    var totalVideos = await Video.countDocuments({
      status: 'public',
      isDuplicate: { $ne: true }
    });

    // If more than 5000 videos, serve a sitemap index
    if (totalVideos > 5000) {
      var totalSitemaps = Math.ceil(totalVideos / 5000);
      var sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Static pages sitemap
      sitemapIndex += '  <sitemap>\n';
      sitemapIndex += '    <loc>' + getBackendUrl() + '/api/public/sitemap-static.xml</loc>\n';
      sitemapIndex += '    <lastmod>' + today + '</lastmod>\n';
      sitemapIndex += '  </sitemap>\n';

      // Video sitemaps (paginated)
      for (var i = 0; i < totalSitemaps; i++) {
        sitemapIndex += '  <sitemap>\n';
        sitemapIndex += '    <loc>' + getBackendUrl() + '/api/public/sitemap-videos-' + (i + 1) + '.xml</loc>\n';
        sitemapIndex += '    <lastmod>' + today + '</lastmod>\n';
        sitemapIndex += '  </sitemap>\n';
      }

      sitemapIndex += '</sitemapindex>';

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(sitemapIndex);
    }

    // If 5000 or fewer videos, serve single sitemap
    var videos = await Video.find({
      status: 'public',
      isDuplicate: { $ne: true }
    })
      .sort({ uploadDate: -1 })
      .limit(5000)
      .select('_id slug title description thumbnail thumbnailUrl cloudinary_public_id uploadDate duration views tags')
      .lean();

    var categories = await Category.find({ isActive: true })
      .select('slug name updatedAt')
      .lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Homepage
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Trending
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/trending</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // Search
    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/search</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Categories
    for (var c = 0; c < categories.length; c++) {
      var catLastmod = categories[c].updatedAt
        ? new Date(categories[c].updatedAt).toISOString().split('T')[0]
        : today;
      xml += '  <url>\n';
      xml += '    <loc>' + frontendUrl + '/category/' + encodeURIComponent(categories[c].slug) + '</loc>\n';
      xml += '    <lastmod>' + catLastmod + '</lastmod>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    // Videos with video sitemap markup
    for (var v = 0; v < videos.length; v++) {
      var video = videos[v];
      var videoUrl = frontendUrl + '/watch/' + video._id;
      if (video.slug) {
        videoUrl += '/' + encodeURIComponent(video.slug);
      }
      var lastmod = video.uploadDate
        ? new Date(video.uploadDate).toISOString().split('T')[0]
        : '';

      // Get thumbnail URL
      var thumbUrl = '';
      if (video.cloudinary_public_id) {
        thumbUrl = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
          '/image/upload/w_1280,h_720,c_fill,q_80,f_jpg/' +
          video.cloudinary_public_id + '.jpg';
      } else if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
        thumbUrl = video.thumbnailUrl;
      } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
        thumbUrl = video.thumbnail;
      }

      // Escape XML special characters
      var safeTitle = (video.title || 'Video')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      var safeDesc = (video.description || video.title || 'Watch this video on Xmaster')
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      if (safeDesc.length > 2048) {
        safeDesc = safeDesc.substring(0, 2045) + '...';
      }

      xml += '  <url>\n';
      xml += '    <loc>' + videoUrl + '</loc>\n';
      if (lastmod) {
        xml += '    <lastmod>' + lastmod + '</lastmod>\n';
      }
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';

      // Video sitemap extension
      if (thumbUrl) {
        xml += '    <video:video>\n';
        xml += '      <video:thumbnail_loc>' + thumbUrl + '</video:thumbnail_loc>\n';
        xml += '      <video:title>' + safeTitle + '</video:title>\n';
        xml += '      <video:description>' + safeDesc + '</video:description>\n';
        xml += '      <video:player_loc allow_embed="yes">https://short.icu/' + (video.file_code || '') + '</video:player_loc>\n';
        if (video.duration && video.duration !== '00:00') {
          var dParts = video.duration.split(':').map(Number);
          var durationSec = 0;
          if (dParts.length === 3) durationSec = dParts[0] * 3600 + dParts[1] * 60 + dParts[2];
          else if (dParts.length === 2) durationSec = dParts[0] * 60 + dParts[1];
          if (durationSec > 0) {
            xml += '      <video:duration>' + durationSec + '</video:duration>\n';
          }
        }
        if (lastmod) {
          xml += '      <video:publication_date>' + lastmod + '</video:publication_date>\n';
        }
        if (video.views) {
          xml += '      <video:view_count>' + video.views + '</video:view_count>\n';
        }
        xml += '      <video:family_friendly>no</video:family_friendly>\n';
        xml += '      <video:live>no</video:live>\n';

        // Add tags (max 32 per Google spec)
        if (video.tags && video.tags.length > 0) {
          var maxTags = Math.min(video.tags.length, 32);
          for (var t = 0; t < maxTags; t++) {
            var safeTag = video.tags[t]
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            xml += '      <video:tag>' + safeTag + '</video:tag>\n';
          }
        }
        xml += '    </video:video>\n';
      }

      // Image sitemap extension
      if (thumbUrl) {
        xml += '    <image:image>\n';
        xml += '      <image:loc>' + thumbUrl + '</image:loc>\n';
        xml += '      <image:title>' + safeTitle + '</image:title>\n';
        xml += '    </image:image>\n';
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// STATIC PAGES SITEMAP (for sitemap index)
// ==========================================
router.get('/sitemap-static.xml', async (req, res) => {
  try {
    var frontendUrl = getFrontendUrl();
    var today = new Date().toISOString().split('T')[0];
    var categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/trending</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    xml += '  <url>\n';
    xml += '    <loc>' + frontendUrl + '/search</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    for (var c = 0; c < categories.length; c++) {
      var catLastmod = categories[c].updatedAt
        ? new Date(categories[c].updatedAt).toISOString().split('T')[0]
        : today;
      xml += '  <url>\n';
      xml += '    <loc>' + frontendUrl + '/category/' + encodeURIComponent(categories[c].slug) + '</loc>\n';
      xml += '    <lastmod>' + catLastmod + '</lastmod>\n';
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Static sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// PAGINATED VIDEO SITEMAPS (for sitemap index)
// ==========================================
router.get('/sitemap-videos-:page.xml', async (req, res) => {
  try {
    var page = parseInt(req.params.page) || 1;
    var perPage = 5000;
    var skip = (page - 1) * perPage;
    var frontendUrl = getFrontendUrl();

    var videos = await Video.find({
      status: 'public',
      isDuplicate: { $ne: true }
    })
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(perPage)
      .select('_id slug title description thumbnail thumbnailUrl cloudinary_public_id uploadDate duration views tags file_code')
      .lean();

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    for (var v = 0; v < videos.length; v++) {
      var video = videos[v];
      var videoUrl = frontendUrl + '/watch/' + video._id;
      if (video.slug) {
        videoUrl += '/' + encodeURIComponent(video.slug);
      }
      var lastmod = video.uploadDate
        ? new Date(video.uploadDate).toISOString().split('T')[0]
        : '';

      var thumbUrl = '';
      if (video.cloudinary_public_id) {
        thumbUrl = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME +
          '/image/upload/w_1280,h_720,c_fill,q_80,f_jpg/' +
          video.cloudinary_public_id + '.jpg';
      } else if (video.thumbnailUrl && video.thumbnailUrl.startsWith('http')) {
        thumbUrl = video.thumbnailUrl;
      } else if (video.thumbnail && video.thumbnail.startsWith('http')) {
        thumbUrl = video.thumbnail;
      }

      var safeTitle = (video.title || 'Video')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      var safeDesc = (video.description || video.title || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      if (safeDesc.length > 2048) safeDesc = safeDesc.substring(0, 2045) + '...';

      xml += '  <url>\n';
      xml += '    <loc>' + videoUrl + '</loc>\n';
      if (lastmod) xml += '    <lastmod>' + lastmod + '</lastmod>\n';
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';

      if (thumbUrl) {
        xml += '    <video:video>\n';
        xml += '      <video:thumbnail_loc>' + thumbUrl + '</video:thumbnail_loc>\n';
        xml += '      <video:title>' + safeTitle + '</video:title>\n';
        xml += '      <video:description>' + (safeDesc || safeTitle) + '</video:description>\n';
        xml += '      <video:player_loc allow_embed="yes">https://short.icu/' + (video.file_code || '') + '</video:player_loc>\n';
        if (video.duration && video.duration !== '00:00') {
          var dParts = video.duration.split(':').map(Number);
          var dSec = 0;
          if (dParts.length === 3) dSec = dParts[0] * 3600 + dParts[1] * 60 + dParts[2];
          else if (dParts.length === 2) dSec = dParts[0] * 60 + dParts[1];
          if (dSec > 0) xml += '      <video:duration>' + dSec + '</video:duration>\n';
        }
        if (lastmod) xml += '      <video:publication_date>' + lastmod + '</video:publication_date>\n';
        if (video.views) xml += '      <video:view_count>' + video.views + '</video:view_count>\n';
        xml += '      <video:family_friendly>no</video:family_friendly>\n';
        xml += '      <video:live>no</video:live>\n';
        if (video.tags && video.tags.length > 0) {
          var maxTags = Math.min(video.tags.length, 32);
          for (var t = 0; t < maxTags; t++) {
            xml += '      <video:tag>' + video.tags[t].replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</video:tag>\n';
          }
        }
        xml += '    </video:video>\n';
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Video sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});


// ==========================================
// ROBOTS.TXT (served from backend for API domain)
// ==========================================
router.get('/robots.txt', (req, res) => {
  var frontendUrl = getFrontendUrl();
  var backendUrl = getBackendUrl();

  var robots = '# Xmaster Robots.txt\n';
  robots += '# https://xmaster.guru\n\n';
  robots += 'User-agent: *\n';
  robots += 'Allow: /api/public/share/\n';
  robots += 'Allow: /api/public/sitemap.xml\n';
  robots += 'Disallow: /api/\n\n';
  robots += 'Sitemap: ' + frontendUrl + '/sitemap.xml\n';
  robots += 'Sitemap: ' + backendUrl + '/api/public/sitemap.xml\n';

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robots);
});


// ==========================================
// CONTACT FORM SUBMISSION
// POST /api/public/contact
// ==========================================
// PASTE THIS BLOCK into publicRoutes.js
// immediately BEFORE: module.exports = router;
// ==========================================

const ContactSubmission = require('../models/ContactSubmission');

// Basic email regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple rate-limit: max 3 submissions per IP per hour (in-memory)
const _contactRateMap = new Map();
const RATE_WINDOW_MS  = 60 * 60 * 1000; // 1 hour
const RATE_MAX        = 3;

function checkContactRateLimit(ip) {
  const now     = Date.now();
  const entry   = _contactRateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    _contactRateMap.set(ip, { windowStart: now, count: 1 });
    return true; // allowed
  }
  if (entry.count >= RATE_MAX) return false; // blocked
  entry.count++;
  return true; // allowed
}

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Server-side validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (message && message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
    }

    // Sanitise — strip HTML tags
    const safeName    = name.trim().replace(/<[^>]*>/g, '').substring(0, 80);
    const safeEmail   = email.trim().toLowerCase().substring(0, 120);
    const safeMessage = (message || '').trim().replace(/<[^>]*>/g, '').substring(0, 2000);

    // Rate limiting by IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    if (!checkContactRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    }

    // Spam honeypot — if a field named "website" is filled (bots fill it), reject silently
    if (req.body.website) {
      // Return success to fool bots but don't save
      return res.status(200).json({ success: true });
    }

    // Save to DB
    await ContactSubmission.create({
      name:      safeName,
      email:     safeEmail,
      message:   safeMessage,
      ipAddress: clientIp,
    });

    res.status(200).json({ success: true, message: 'Your message has been received.' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit message. Please try again.' });
  }
});

module.exports = router;