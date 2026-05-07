// src/components/video/VideoPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiAlertCircle, FiRefreshCw, FiMaximize } from 'react-icons/fi';

const VideoPlayer = ({
  embedUrl,
  title    = '',
  autoPlay = false,
  className= '',
  onLoad   = null,
  onError  = null,
}) => {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [started,  setStarted]  = useState(autoPlay);
  const iframeRef    = useRef(null);
  const containerRef = useRef(null);

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

  const handleIframeLoad  = () => { setLoading(false); setError(false); onLoad?.(); };
  const handleIframeError = () => { setLoading(false); setError(true);  onError?.(); };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) iframeRef.current.src = finalUrl;
  };

  // Fix: copy ref value inside effect to avoid stale ref warning
  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      if (iframe) iframe.src = 'about:blank';
    };
  }, []);

  if (!embedUrl) return <NoVideoState className={className} />;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {!started && (
        <ClickToPlay title={title} embedUrl={embedUrl} onPlay={() => setStarted(true)} />
      )}

      {started && loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary-600 animate-spin mb-4" />
          <p className="text-xs text-white/30">Loading player...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-400 z-10">
          <FiAlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
          <p className="text-sm text-white/50 mb-4 text-center px-4">Failed to load video player</p>
          <button onClick={handleRetry} className="btn-secondary flex items-center gap-2 text-sm">
            <FiRefreshCw className="w-4 h-4" />Retry
          </button>
        </div>
      )}

      {started && finalUrl && (
        <iframe
          ref={iframeRef}
          src={finalUrl}
          title={title || 'Video Player'}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {started && !loading && !error && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <span className="flex items-center gap-1 text-[10px] text-white/40 bg-black/60 px-2 py-1 rounded-lg">
            <FiMaximize className="w-2.5 h-2.5" />Fullscreen inside player
          </span>
        </div>
      )}
    </div>
  );
};

const ClickToPlay = ({ title, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-400 cursor-pointer group"
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-dark-400 via-dark-400 to-dark-500" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className={`w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(225,29,72,0.5)] border-4 border-white/20 ${hovered ? 'scale-110 shadow-[0_0_60px_rgba(225,29,72,0.7)]' : 'scale-100'}`}>
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

const NoVideoState = ({ className }) => (
  <div className={`relative w-full bg-dark-300 rounded-xl flex items-center justify-center ${className}`} style={{ aspectRatio: '16/9' }}>
    <div className="flex flex-col items-center gap-3 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <FiPlay className="w-7 h-7 text-white/20" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/40">Video unavailable</p>
        <p className="text-xs text-white/25 mt-1">This video cannot be played at this time</p>
      </div>
    </div>
  </div>
);

export default VideoPlayer;