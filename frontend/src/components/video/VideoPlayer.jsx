// src/components/video/VideoPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiAlertCircle, FiRefreshCw, FiMaximize2 } from 'react-icons/fi';

// ============================================================
// EMBED URL BUILDER
// short.icu links are redirect links — they work in browser
// tabs but often fail inside iframes due to X-Frame-Options.
// The correct embeddable URL for abyss.to / short.icu players
// is: https://abysscdn.com/?v=FILE_CODE
// We extract the file code from whatever URL/code is stored
// and build the proper embed URL.
// ============================================================
const buildEmbedUrl = (rawUrl, autoPlay = false) => {
  if (!rawUrl) return null;

  let fileCode = null;

  try {
    // Case 1: already a full abysscdn.com embed URL
    if (rawUrl.includes('abysscdn.com')) {
      const url = new URL(rawUrl);
      if (autoPlay) url.searchParams.set('autoplay', '1');
      return url.toString();
    }

    // Case 2: short.icu/FILE_CODE — extract the code
    if (rawUrl.includes('short.icu/')) {
      fileCode = rawUrl.split('short.icu/').pop().split('?')[0].trim();
    }

    // Case 3: raw file code (no slashes, no dots in domain position)
    if (!fileCode && !rawUrl.includes('/') && !rawUrl.includes('.')) {
      fileCode = rawUrl.trim();
    }

    // Case 4: any other URL — try to get the last path segment
    if (!fileCode) {
      try {
        const parsed = new URL(rawUrl);
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          fileCode = segments[segments.length - 1];
        }
      } catch {
        // rawUrl might not be a valid URL — use as-is
        fileCode = rawUrl.trim();
      }
    }
  } catch {
    fileCode = rawUrl.trim();
  }

  if (!fileCode) return null;

  // Build proper abysscdn embed URL
  const base = `https://abysscdn.com/?v=${encodeURIComponent(fileCode)}`;
  return autoPlay ? `${base}&autoplay=1` : base;
};

// ============================================================
// FULLSCREEN HELPERS
// ============================================================
const requestFullscreen = (el) => {
  if (!el) return;
  try {
    if (el.requestFullscreen)       return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.webkitEnterFullscreen)   return el.webkitEnterFullscreen();
    if (el.mozRequestFullScreen)    return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)     return el.msRequestFullscreen();
  } catch { /* iframe handles its own fullscreen */ }
};

const exitFullscreen = () => {
  try {
    if (document.exitFullscreen)       return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)  return document.mozCancelFullScreen();
    if (document.msExitFullscreen)     return document.msExitFullscreen();
  } catch { /* ignore */ }
};

const isFullscreenNow = () =>
  !!(document.fullscreenElement ||
     document.webkitFullscreenElement ||
     document.mozFullScreenElement ||
     document.msFullscreenElement);

// ============================================================
// AD CLICK GUARD
// Sets window.__playerInteracting so the popunder wrapper
// script in GlobalAdsLoader suppresses the ad on player clicks.
// We use mousedown/touchstart — these fire BEFORE click so the
// flag is already true when the popunder's click handler runs.
// We do NOT use stopPropagation here — that was breaking the
// play button by eating clicks before React could handle them.
// ============================================================
const setPlayerInteracting = () => {
  window.__playerInteracting = true;
  clearTimeout(window.__playerInteractTimer);
  window.__playerInteractTimer = setTimeout(() => {
    window.__playerInteracting = false;
  }, 2000);
};

// ============================================================
// VIDEO PLAYER
// ============================================================
const VideoPlayer = ({
  embedUrl,
  fileCode  = null,   // optional: pass file_code directly
  title     = '',
  autoPlay  = false,
  className = '',
  onLoad    = null,
  onError   = null,
}) => {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [started,      setStarted]      = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef    = useRef(null);
  const containerRef = useRef(null);

  // Build the correct embed URL
  // Prefer fileCode prop, then parse from embedUrl
  const rawSource = fileCode
    ? `https://short.icu/${fileCode}`
    : embedUrl;

  const finalUrl = buildEmbedUrl(rawSource, autoPlay && started);

  // ── Iframe event handlers ──────────────────────────────
  const handleIframeLoad  = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };
  const handleIframeError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = finalUrl;
      }, 100);
    }
  };

  // ── Player interaction guard (mousedown/touchstart) ───
  // Fires BEFORE click so __playerInteracting is true
  // when the popunder's click listener runs.
  // Does NOT stopPropagation — play button works normally.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousedown', setPlayerInteracting, true);
    el.addEventListener('touchstart', setPlayerInteracting, { capture: true, passive: true });
    return () => {
      el.removeEventListener('mousedown', setPlayerInteracting, true);
      el.removeEventListener('touchstart', setPlayerInteracting, true);
    };
  }, []);

  // ── Cleanup iframe src on unmount ─────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    return () => { if (iframe) iframe.src = 'about:blank'; };
  }, []);

  // ── Fullscreen change listener ────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(isFullscreenNow());
    document.addEventListener('fullscreenchange',       onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange',    onFsChange);
    document.addEventListener('MSFullscreenChange',     onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange',       onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange',    onFsChange);
      document.removeEventListener('MSFullscreenChange',     onFsChange);
    };
  }, []);

  // ── Fullscreen button handler ─────────────────────────
  const handleFullscreenBtn = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setPlayerInteracting(); // suppress ad on fullscreen click
    if (isFullscreenNow()) {
      exitFullscreen();
    } else {
      requestFullscreen(containerRef.current);
    }
  }, []);

  // ── Play handler ──────────────────────────────────────
  const handlePlay = useCallback(() => {
    setPlayerInteracting();
    setStarted(true);
    setLoading(true);
    setError(false);
  }, []);

  if (!rawSource) return <NoVideoState className={className} />;

  return (
    <div
      ref={containerRef}
      data-player-container="true"
      className={`
        relative w-full bg-black
        ${isFullscreen ? 'rounded-none' : 'rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]'}
        ${className}
      `}
      style={{
        aspectRatio: '16/9',
        // Do NOT use overflow:hidden on outer container —
        // it clips the browser's native fullscreen transition
        // on Safari/iOS WebKit
        overflow: 'visible',
      }}
    >
      {/* Inner clip wrapper — clips visually but not FS API */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Click-to-play overlay */}
        {!started && (
          <ClickToPlay title={title} onPlay={handlePlay} />
        )}

        {/* Loading spinner */}
        {started && loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary-600 animate-spin mb-4" />
            <p className="text-xs text-white/30">Loading player...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10 p-4">
            <FiAlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
            <p className="text-sm text-white/50 mb-4 text-center">
              Failed to load video player
            </p>
            <button
              onClick={handleRetry}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiRefreshCw className="w-4 h-4" />Retry
            </button>
          </div>
        )}

        {/* Iframe — only mounts after play is clicked */}
        {started && finalUrl && (
          <iframe
            ref={iframeRef}
            src={finalUrl}
            title={title || 'Video Player'}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            scrolling="no"
            frameBorder="0"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={`
              absolute inset-0 w-full h-full border-0
              transition-opacity duration-500
              ${loading ? 'opacity-0' : 'opacity-100'}
            `}
          />
        )}
      </div>

      {/* Fullscreen button — outside inner clip div so it's never clipped */}
      {started && !loading && !error && (
        <button
          onClick={handleFullscreenBtn}
          onMouseDown={(e) => { e.stopPropagation(); setPlayerInteracting(); }}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="
            absolute bottom-3 right-3 z-30
            w-8 h-8 rounded-lg
            bg-black/60 hover:bg-black/80
            border border-white/20 hover:border-white/40
            flex items-center justify-center
            text-white/60 hover:text-white
            transition-all duration-200
            opacity-0 hover:opacity-100
          "
          style={{ pointerEvents: 'all' }}
        >
          <FiMaximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ============================================================
// CLICK TO PLAY OVERLAY
// ============================================================
const ClickToPlay = ({ title, onPlay }) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback((e) => {
    // Set the interaction flag before calling onPlay
    // so any ad script that might react to this click
    // sees the guard is active
    setPlayerInteracting();
    // Do NOT stopPropagation — it was breaking play on some
    // browsers by preventing React's own event handling
    onPlay();
  }, [onPlay]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-400 cursor-pointer select-none"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-400 via-dark-400 to-dark-500" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Play button + label */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className={`
            w-20 h-20 rounded-full bg-primary-600
            flex items-center justify-center
            transition-all duration-300
            shadow-[0_0_40px_rgba(225,29,72,0.5)]
            border-4 border-white/20
            ${hovered
              ? 'scale-110 shadow-[0_0_60px_rgba(225,29,72,0.7)]'
              : 'scale-100'
            }
          `}
        >
          <FiPlay className="w-8 h-8 text-white fill-white ml-1" />
        </div>
        {title && (
          <div className="text-sm font-medium text-white/60 text-center max-w-xs px-4 bg-black/30 backdrop-blur-sm py-2 rounded-xl line-clamp-2">
            {title}
          </div>
        )}
        <p className="text-xs text-white/30">Click to play</p>
      </div>
    </div>
  );
};

// ============================================================
// NO VIDEO STATE
// ============================================================
const NoVideoState = ({ className }) => (
  <div
    className={`relative w-full bg-dark-300 rounded-xl flex items-center justify-center ${className}`}
    style={{ aspectRatio: '16/9' }}
  >
    <div className="flex flex-col items-center gap-3 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <FiPlay className="w-7 h-7 text-white/20" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/40">Video unavailable</p>
        <p className="text-xs text-white/25 mt-1">
          This video cannot be played at this time
        </p>
      </div>
    </div>
  </div>
);

export default VideoPlayer;