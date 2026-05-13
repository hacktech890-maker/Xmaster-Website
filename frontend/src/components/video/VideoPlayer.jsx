// src/components/video/VideoPlayer.jsx
// Updated for AbyssPlayer iframe-only embed system
// Backward compatible with old short.icu / short.ink / abyss.to URLs

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  FiPlay,
  FiAlertCircle,
  FiRefreshCw,
  FiMaximize2,
  FiClock,
} from 'react-icons/fi';
import { getEmbedUrl } from '../../utils/helpers';

// ============================================================
// CONSTANTS
// ============================================================
const ABYSS_PLAYER_BASE = 'https://abyssplayer.com';

// ============================================================
// SECURITY: validate that a URL is safe for our iframe
// Only trust https://abyssplayer.com/*
// ============================================================
const isSafeEmbedUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'abyssplayer.com' ||
        parsed.hostname === 'www.abyssplayer.com')
    );
  } catch {
    return false;
  }
};

// ============================================================
// FULLSCREEN HELPER
// ============================================================
const requestFullscreen = (el) => {
  if (!el) return;
  try {
    if (el.requestFullscreen)       return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.webkitEnterFullscreen)   return el.webkitEnterFullscreen();
    if (el.mozRequestFullScreen)    return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)     return el.msRequestFullscreen();
  } catch (e) { /* ignore */ }
};

const exitFullscreen = () => {
  try {
    if (document.exitFullscreen)       return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)  return document.mozCancelFullScreen();
    if (document.msExitFullscreen)     return document.msExitFullscreen();
  } catch (e) { /* ignore */ }
};

const isFullscreenNow = () =>
  !!(
    document.fullscreenElement       ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement    ||
    document.msFullscreenElement
  );

// ============================================================
// PLAYER INTERACTION FLAG
// ============================================================
const markPlayerInteracting = () => {
  window.__playerInteracting = true;
  clearTimeout(window.__playerInteractTimer);
  window.__playerInteractTimer = setTimeout(() => {
    window.__playerInteracting = false;
  }, 2000);
};

// ============================================================
// MAIN VIDEO PLAYER
// ============================================================
/**
 * VideoPlayer
 *
 * Props:
 *   video      {object}  - Full video document from API (preferred)
 *   embedUrl   {string}  - Direct embed URL (fallback if no video object)
 *   fileCode   {string}  - Raw slug/filecode (fallback)
 *   title      {string}
 *   autoPlay   {boolean}
 *   className  {string}
 *   onLoad     {function}
 *   onError    {function}
 */
const VideoPlayer = ({
  video     = null,
  embedUrl  = null,
  fileCode  = null,
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
  const [retryCount,   setRetryCount]   = useState(0);

  const iframeRef    = useRef(null);
  const containerRef = useRef(null);

  // ── Resolve the canonical, safe AbyssPlayer URL ──────────
  const resolvedEmbedUrl = (() => {
    // Priority 1: full video object (uses our getEmbedUrl helper)
    if (video) {
      return getEmbedUrl(video);
    }
    // Priority 2: explicit embedUrl prop (normalize it)
    if (embedUrl) {
      // If already abyssplayer.com, use directly
      if (embedUrl.includes('abyssplayer.com')) return embedUrl;
      // Otherwise normalize from old format
      try {
        const { normalizeAbyssUrl } = require('../../utils/helpers');
        const normalized = normalizeAbyssUrl(embedUrl);
        if (normalized) return normalized;
      } catch { /* ignore */ }
      return embedUrl; // use as-is (will fail security check below)
    }
    // Priority 3: raw fileCode/slug
    if (fileCode) {
      return `${ABYSS_PLAYER_BASE}/${fileCode}`;
    }
    return null;
  })();

  // Security check — only render iframe for trusted URLs
  const finalUrl = resolvedEmbedUrl && isSafeEmbedUrl(resolvedEmbedUrl)
    ? resolvedEmbedUrl
    : null;

  // ── Reset when video changes ─────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(false);
    setRetryCount(0);
    setStarted(autoPlay);
  }, [resolvedEmbedUrl, autoPlay]);

  // ── Iframe event handlers ────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleIframeError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setRetryCount((p) => p + 1);
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current && finalUrl) {
          iframeRef.current.src = finalUrl;
        }
      }, 300);
    }
  }, [finalUrl]);

  // ── Player interaction guard ─────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => markPlayerInteracting();
    el.addEventListener('mousedown',   handler, true);
    el.addEventListener('touchstart',  handler, true);
    el.addEventListener('pointerdown', handler, true);
    return () => {
      el.removeEventListener('mousedown',   handler, true);
      el.removeEventListener('touchstart',  handler, true);
      el.removeEventListener('pointerdown', handler, true);
    };
  }, []);

  // ── Cleanup iframe src on unmount ────────────────────────
  useEffect(() => {
    const iframe = iframeRef.current;
    return () => { if (iframe) iframe.src = 'about:blank'; };
  }, []);

  // ── Fullscreen change listener ───────────────────────────
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

  // ── Fullscreen button ────────────────────────────────────
  const handleFullscreenBtn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    markPlayerInteracting();
    if (isFullscreenNow()) exitFullscreen();
    else requestFullscreen(containerRef.current);
  }, []);

  const handleStart = useCallback(() => {
    markPlayerInteracting();
    setStarted(true);
    setLoading(true);
    setError(false);
  }, []);

  // No valid video to play
  if (!finalUrl && !started) {
    return <NoVideoState className={className} />;
  }

  const videoTitle = title || video?.title || 'Video Player';

  return (
    <div
      ref={containerRef}
      data-player-container="true"
      className={`
        relative w-full bg-black
        rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        ${isFullscreen ? 'rounded-none' : ''}
        ${className}
      `}
      style={{ aspectRatio: '16/9', overflow: 'visible' }}
    >
      {/* Inner clip wrapper */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Click-to-play overlay */}
        {!started && (
          <ClickToPlay
            title={videoTitle}
            thumbnail={video ? getThumbnailFromVideo(video) : null}
            onPlay={handleStart}
          />
        )}

        {/* Loading skeleton */}
        {started && loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary-600 animate-spin mb-4" />
            <p className="text-xs text-white/30">Loading player...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <ErrorState
            retryCount={retryCount}
            onRetry={handleRetry}
          />
        )}

        {/* ── IFRAME — only renders when started + URL is safe ── */}
        {started && finalUrl && (
          <iframe
            ref={iframeRef}
            /*
             * SECURITY:
             *   - finalUrl is validated to be https://abyssplayer.com/*
             *   - We never dangerously inject raw HTML
             *   - We construct the URL ourselves from the extracted slug
             */
            src={finalUrl}
            title={videoTitle}
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
              absolute inset-0 w-full h-full
              transition-opacity duration-500
              ${loading ? 'opacity-0' : 'opacity-100'}
            `}
            style={{ border: 'none' }}
          />
        )}

        {/* Fallback: started but no safe URL */}
        {started && !finalUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10 px-6">
            <FiAlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
            <p className="text-sm font-semibold text-white/60 mb-1 text-center">
              Invalid video URL
            </p>
            <p className="text-xs text-white/30 text-center leading-relaxed">
              Could not build a valid player URL for this video.
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen button */}
      {started && !loading && !error && (
        <button
          onClick={handleFullscreenBtn}
          onMouseDown={() => markPlayerInteracting()}
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
            group-hover:opacity-100
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
// INTERNAL HELPERS
// ============================================================

/** Get thumbnail URL from a video object (inline for this component) */
const getThumbnailFromVideo = (video) => {
  if (!video) return null;
  if (video.thumbnailUrl?.startsWith('http')) return video.thumbnailUrl;
  if (video.thumbnail?.startsWith('http'))    return video.thumbnail;
  if (video.abyssSlug) return `https://abyss.to/splash/${video.abyssSlug}.jpg`;
  if (video.file_code) return `https://abyss.to/splash/${video.file_code}.jpg`;
  return null;
};

// ============================================================
// CLICK TO PLAY OVERLAY
// ============================================================
const ClickToPlay = ({ title, thumbnail, onPlay }) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    markPlayerInteracting();
    onPlay();
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-400 cursor-pointer group"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background: thumbnail or gradient */}
      {thumbnail ? (
        <>
          <img
            src={thumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-dark-400 via-dark-400 to-dark-500" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize:  '40px 40px',
            }}
          />
        </>
      )}

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
          <div className="text-sm font-medium text-white/80 text-center max-w-xs px-4 bg-black/40 backdrop-blur-sm py-2 rounded-xl">
            {title}
          </div>
        )}

        <p className="text-xs text-white/40">Click to play</p>
      </div>
    </div>
  );
};

// ============================================================
// ERROR STATE
// ============================================================
const ErrorState = ({ retryCount, onRetry }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10 px-6">
    {retryCount < 2 ? (
      <>
        <FiAlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
        <p className="text-sm font-semibold text-white/60 mb-1 text-center">
          Failed to load video
        </p>
        <p className="text-xs text-white/30 mb-5 text-center leading-relaxed">
          The video server may be temporarily unavailable.
        </p>
        <button
          onClick={onRetry}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <FiRefreshCw className="w-4 h-4" />
          Retry
        </button>
      </>
    ) : (
      <>
        <FiClock className="w-10 h-10 text-amber-400/60 mb-3" />
        <p className="text-sm font-semibold text-white/60 mb-1 text-center">
          Video temporarily unavailable
        </p>
        <p className="text-xs text-white/30 mb-5 text-center leading-relaxed max-w-xs">
          Our video server is experiencing issues.
          Please check back in a few minutes.
        </p>
        <button
          onClick={onRetry}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs
            font-medium text-white/40 border border-white/10
            hover:text-white/70 hover:border-white/20
            transition-all duration-200
          "
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Try again anyway
        </button>
      </>
    )}
  </div>
);

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