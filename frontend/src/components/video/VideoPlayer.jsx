// src/components/video/VideoPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiAlertCircle, FiRefreshCw, FiMaximize2 } from 'react-icons/fi';

// ============================================================
// FULLSCREEN HELPER
// Tries every vendor-prefixed fullscreen API in order.
// Called on the CONTAINER element, not the iframe itself —
// this is what works reliably across Chrome/Safari/Firefox/iOS.
// ============================================================
const requestFullscreen = (el) => {
  if (!el) return;
  try {
    if (el.requestFullscreen)            return el.requestFullscreen();
    if (el.webkitRequestFullscreen)      return el.webkitRequestFullscreen();
    if (el.webkitEnterFullscreen)        return el.webkitEnterFullscreen();
    if (el.mozRequestFullScreen)         return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)          return el.msRequestFullscreen();
  } catch (e) {
    // Silently fail — iframe embed handles its own fullscreen
  }
};

const exitFullscreen = () => {
  try {
    if (document.exitFullscreen)         return document.exitFullscreen();
    if (document.webkitExitFullscreen)   return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)    return document.mozCancelFullScreen();
    if (document.msExitFullscreen)       return document.msExitFullscreen();
  } catch (e) { /* ignore */ }
};

const isFullscreenNow = () =>
  !!(document.fullscreenElement ||
     document.webkitFullscreenElement ||
     document.mozFullScreenElement ||
     document.msFullscreenElement);

// ============================================================
// CLICK GUARD
// Stops popunder ad scripts from firing when the user clicks
// anywhere inside the player container.
//
// Popunder scripts work by attaching a listener to document
// and firing on ANY click. By calling stopPropagation on the
// capture phase from our container, we prevent those listeners
// from ever seeing player-area clicks.
//
// We attach this as a native DOM listener (not React synthetic)
// because React's synthetic events don't support capture-phase
// stopPropagation reliably across all browsers.
// ============================================================
const attachClickGuard = (el) => {
  if (!el) return () => {};
  const handler = (e) => {
    // Only block propagation to document — don't preventDefault
    // (that would break the fullscreen button and play click)
    e.stopPropagation();
  };
  el.addEventListener('click', handler, true); // capture phase
  return () => el.removeEventListener('click', handler, true);
};

// ============================================================
// VIDEO PLAYER
// ============================================================
const VideoPlayer = ({
  embedUrl,
  title    = '',
  autoPlay = false,
  className= '',
  onLoad   = null,
  onError  = null,
}) => {
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [started,    setStarted]    = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef    = useRef(null);
  const containerRef = useRef(null);

  // ── Build embed URL ──────────────────────────────────────
  const buildEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (autoPlay && started) parsed.searchParams.set('autoplay', '1');
      return parsed.toString();
    } catch {
      return url;
    }
  };

  const finalUrl = buildEmbedUrl(embedUrl);

  // ── Iframe event handlers ────────────────────────────────
  const handleIframeLoad  = () => { setLoading(false); setError(false); onLoad?.(); };
  const handleIframeError = () => { setLoading(false); setError(true);  onError?.(); };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) iframeRef.current.src = finalUrl;
  };

  // ── Click guard — stops popunder scripts on player clicks ─
  useEffect(() => {
    const cleanup = attachClickGuard(containerRef.current);
    return cleanup;
  }, [started]); // re-attach when started changes (overlay removed)

  // ── Sync player interaction flag to window for ad guard ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      window.__playerInteracting = true;
      clearTimeout(window.__playerInteractTimer);
      window.__playerInteractTimer = setTimeout(() => {
        window.__playerInteracting = false;
      }, 2000);
    };
    el.addEventListener('mousedown', handler, true);
    el.addEventListener('touchstart', handler, true);
    el.addEventListener('click',      handler, true);
    return () => {
      el.removeEventListener('mousedown', handler, true);
      el.removeEventListener('touchstart', handler, true);
      el.removeEventListener('click',      handler, true);
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

  // ── Fullscreen button handler ────────────────────────────
  const handleFullscreenBtn = useCallback((e) => {
    // Stop the click from bubbling to document (ad guard)
    e.stopPropagation();
    e.preventDefault();
    if (isFullscreenNow()) {
      exitFullscreen();
    } else {
      requestFullscreen(containerRef.current);
    }
  }, []);

  if (!embedUrl) return <NoVideoState className={className} />;

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full bg-black
        rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        ${isFullscreen ? 'rounded-none' : ''}
        ${className}
      `}
      style={{
        aspectRatio: '16/9',
        // CRITICAL: Do NOT use overflow-hidden here.
        // overflow-hidden clips the browser's native fullscreen
        // transition on Safari and iOS WebKit.
        overflow: 'visible',
      }}
    >
      {/* Inner clip wrapper — only clips visually, not the FS API */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* ── Click-to-play overlay ──────────────────────── */}
        {!started && (
          <ClickToPlay
            title={title}
            onPlay={() => setStarted(true)}
          />
        )}

        {/* ── Loading spinner ────────────────────────────── */}
        {started && loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary-600 animate-spin mb-4" />
            <p className="text-xs text-white/30">Loading player...</p>
          </div>
        )}

        {/* ── Error state ────────────────────────────────── */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
            <FiAlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
            <p className="text-sm text-white/50 mb-4 text-center px-4">
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

        {/* ── Iframe ─────────────────────────────────────── */}
        {started && finalUrl && (
          <iframe
            ref={iframeRef}
            src={finalUrl}
            title={title || 'Video Player'}
            // CRITICAL allow attribute — must include fullscreen
            // Do NOT use sandbox — it blocks the fullscreen API
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
            allowFullScreen={true}
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
      </div>

      {/* ── Fullscreen button (outside inner clip div, z above) ─
          Rendered separately so it's always accessible and not
          clipped by the inner overflow-hidden wrapper.
          pointer-events-none on the container prevents ad scripts
          from seeing this as a "document click" target.          */}
      {started && !loading && !error && (
        <button
          onClick={handleFullscreenBtn}
          onMouseDown={(e) => e.stopPropagation()}
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
// CLICK TO PLAY OVERLAY
// ============================================================
const ClickToPlay = ({ title, onPlay }) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // don't let this bubble to ad scripts
    onPlay();
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-400 cursor-pointer group"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-dark-400 via-dark-400 to-dark-500" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
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
          <div className="text-sm font-medium text-white/60 text-center max-w-xs px-4 bg-black/30 backdrop-blur-sm py-2 rounded-xl">
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