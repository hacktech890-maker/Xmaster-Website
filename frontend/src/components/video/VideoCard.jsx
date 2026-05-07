// src/components/video/VideoCard.jsx
// ═══════════════════════════════════════════════════════════════
// PREMIUM VIDEO CARD — Netflix/YouTube-style hover preview system
//
// Architecture:
//   • useVideoPreview  — singleton hover state (only 1 active globally)
//   • useIntersection  — lazy-loads thumbnail only when in viewport
//   • HoverOverlay     — cinematic info panel that slides up on hover
//   • No direct video stream (embed-only backend) → thumbnail-based
//     cinematic preview with animated metadata, progress bar, glow
//
// Mobile: hover system fully disabled on touch/pointer:coarse devices
// Performance: no extra network requests, reuses existing video data
// ═══════════════════════════════════════════════════════════════
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlay,
  FiEye,
  FiClock,
  FiHeart,
  FiStar,
  FiCalendar,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import {
  getThumbnailUrl,
  formatDuration,
  formatViewsShort,
  formatDate,
  getWatchUrl,
} from '../../utils/helpers';
import { useIntersection }   from '../../hooks/useIntersection';
import { useVideoPreview }   from '../../hooks/useVideoPreview';
// ─── FIX: Removed unused PremiumBadge import ────────────────
import Badge, { HDBadge } from '../common/Badge';
// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const CARD_SIZES = {
  default: {
    card:    'w-full',
    thumb:   'aspect-video',
    title:   'text-sm',
    meta:    'text-xs',
    padding: 'p-3',
  },
  large: {
    card:    'w-full',
    thumb:   'aspect-video',
    title:   'text-base',
    meta:    'text-xs',
    padding: 'p-4',
  },
  small: {
    card:    'w-full',
    thumb:   'aspect-video',
    title:   'text-xs',
    meta:    'text-[10px]',
    padding: 'p-2.5',
  },
  wide: {
    card:    'w-48 sm:w-56 md:w-64 flex-shrink-0',
    thumb:   'aspect-video',
    title:   'text-xs',
    meta:    'text-[10px]',
    padding: 'p-2.5',
  },
};
// ─────────────────────────────────────────────────────────────
// FALLBACK THUMBNAIL
// ─────────────────────────────────────────────────────────────
const getFallbackThumb = () =>
  `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect width="320" height="180" fill="#141414"/>
      <rect x="125" y="65" width="70" height="50" rx="8" fill="#1a1a1a"/>
      <polygon points="142,78 170,90 142,102" fill="#e11d48" opacity="0.7"/>
      <text x="160" y="148" font-family="Inter,sans-serif" font-size="10" fill="#333" text-anchor="middle">No Preview</text>
    </svg>`
  )}`;
// ─────────────────────────────────────────────────────────────
// QUALITY LABEL HELPER
// ─────────────────────────────────────────────────────────────
const getQualityLabel = (video) => {
  if (video.quality === '4K' || video.is_4k)   return '4K';
  if (video.quality === 'FHD' || video.is_fhd) return 'FHD';
  if (video.quality === 'HD'  || video.is_hd)  return 'HD';
  return null;
};
// ─────────────────────────────────────────────────────────────
// QUALITY BADGE COMPONENT
// ─────────────────────────────────────────────────────────────
const QualityBadge = ({ label }) => {
  if (!label) return null;
  const colorMap = {
    '4K':  'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'FHD': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'HD':  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  };
  return (
    <span className={`
      inline-flex items-center px-1.5 py-0.5 rounded-md
      text-[10px] font-bold border tracking-wider
      ${colorMap[label] || colorMap['HD']}
    `}>
      {label}
    </span>
  );
};
// ─────────────────────────────────────────────────────────────
// HOVER INFO OVERLAY
// The cinematic panel that appears over the card on hover.
// Slides up from the bottom of the thumbnail area.
// ─────────────────────────────────────────────────────────────
const HoverInfoOverlay = memo(({ video, visible, qualityLabel }) => {
  const category = typeof video.category === 'string'
    ? video.category
    : video.category?.name || '';
  const tags        = video.tags?.slice(0, 5) || [];
  const desc        = video.description?.trim();
  const duration    = formatDuration(video.duration);
  const views       = formatViewsShort(video.views);
  const date        = formatDate(video.uploadDate || video.createdAt);
  const isTrending  = video.trending || (video.views >= 50000);
  const isPremium   = video.premium || video.featured;
  const studio      = video.studio || video.folder || '';
  return (
    <div
      className={`
        absolute inset-x-0 bottom-0 pointer-events-none select-none
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      aria-hidden="true"
    >
      {/* ── Cinematic gradient overlay over thumbnail ─────────── */}
      <div
        className={`
          absolute inset-x-0 bottom-0
          transition-all duration-400
          ${visible ? 'h-[110%]' : 'h-[60%]'}
        `}
        style={{
          background: visible
            ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(5,5,12,0.55) 28%, rgba(5,5,12,0.92) 60%, rgba(5,5,12,1) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)',
          transition: 'height 0.35s ease, background 0.35s ease',
        }}
      />
      {/* ── Progress bar — "preview playing" indicator ─────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden">
        {visible && (
          <div
            className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 preview-progress-bar"
            style={{ borderRadius: '0 2px 2px 0' }}
          />
        )}
      </div>
      {/* ── Info content panel ───────────────────────────────────── */}
      {visible && (
        <div
          className="relative px-3 pb-3 pt-2 preview-info-panel"
          style={{ zIndex: 2 }}
        >
          {/* Row 1 — Category + Trending badge */}
          <div className="meta-row-1 flex items-center gap-1.5 mb-1.5 flex-wrap">
            {category && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary-600/20 text-primary-400 border border-primary-600/25 truncate max-w-[90px] tracking-wide">
                {category}
              </span>
            )}
            {studio && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/[0.06] text-white/40 border border-white/[0.08] truncate max-w-[80px]">
                {studio}
              </span>
            )}
            {isTrending && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <FiTrendingUp className="w-2 h-2" />
                HOT
              </span>
            )}
            {isPremium && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <FiZap className="w-2 h-2" />
                PREMIUM
              </span>
            )}
          </div>
          {/* Row 2 — Title */}
          <div className="meta-row-2 mb-1.5">
            <h3 className="text-[12px] font-bold text-white leading-snug line-clamp-2 text-shadow-lg">
              {video.title || 'Untitled Video'}
            </h3>
          </div>
          {/* Row 3 — Stats pills */}
          <div className="meta-row-3 flex items-center gap-2 mb-2 flex-wrap">
            {/* Views */}
            <span className="flex items-center gap-1 text-[9px] font-semibold text-white/55 preview-stat-pill">
              <FiEye className="w-2 h-2 text-white/40" />
              {views}
            </span>
            {/* Duration */}
            {duration && (
              <span className="flex items-center gap-1 text-[9px] font-semibold text-white/55 preview-stat-pill">
                <FiClock className="w-2 h-2 text-white/40" />
                {duration}
              </span>
            )}
            {/* Date */}
            {date && (
              <span className="flex items-center gap-1 text-[9px] font-medium text-white/35 preview-stat-pill">
                <FiCalendar className="w-2 h-2 text-white/30" />
                {date}
              </span>
            )}
            {/* Quality */}
            {qualityLabel && (
              <QualityBadge label={qualityLabel} />
            )}
          </div>
          {/* Row 4 — Description */}
          {desc && (
            <div className="meta-row-4 mb-2">
              <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                {desc}
              </p>
            </div>
          )}
          {/* Row 5 — Tags */}
          {tags.length > 0 && (
            <div className="meta-row-5 flex items-center gap-1 flex-wrap">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`preview-tag-chip-neutral tag-chip-${Math.min(i + 1, 5)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
HoverInfoOverlay.displayName = 'HoverInfoOverlay';
// ─────────────────────────────────────────────────────────────
// PLAY BUTTON OVERLAY
// Cinematic play button with ripple ring
// ─────────────────────────────────────────────────────────────
const PlayButtonOverlay = memo(({ visible }) => (
  <div
    className={`
      absolute inset-0 flex items-center justify-center
      pointer-events-none
      transition-all duration-300
      ${visible ? 'opacity-100' : 'opacity-0'}
    `}
    style={{ zIndex: 3 }}
  >
    <div className="relative flex items-center justify-center">
      {/* Ripple ring */}
      {visible && (
        <div className="absolute w-14 h-14 rounded-full border-2 border-primary-500/40 play-ripple" />
      )}
      {/* Button */}
      <div
        className={`
          relative w-12 h-12 rounded-full
          flex items-center justify-center
          border-2 border-white/25
          transition-transform duration-300
          ${visible ? 'scale-100' : 'scale-75'}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(225,29,72,0.95) 0%, rgba(190,18,60,0.95) 100%)',
          boxShadow: visible
            ? '0 0 0 4px rgba(225,29,72,0.15), 0 8px 32px rgba(225,29,72,0.45)'
            : 'none',
        }}
      >
        <FiPlay className="w-5 h-5 text-white fill-white ml-0.5 flex-shrink-0" />
      </div>
    </div>
  </div>
));
PlayButtonOverlay.displayName = 'PlayButtonOverlay';
// ─────────────────────────────────────────────────────────────
// BADGE ROW — top-left/right of thumbnail
// ─────────────────────────────────────────────────────────────
const ThumbnailBadges = memo(({ isHD, qualityLabel, isPremium, featured, views, duration, hovered }) => (
  <>
    {/* Top badges */}
    <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none z-10">
      <div className="flex gap-1.5 flex-wrap">
        {qualityLabel && !isHD && <QualityBadge label={qualityLabel} />}
        {isHD && !qualityLabel && <HDBadge />}
        {isPremium && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wide">
            ⭐ PREMIUM
          </span>
        )}
        {featured && (
          <Badge variant="primary" size="xs">
            <FiStar className="w-2.5 h-2.5" />
            Featured
          </Badge>
        )}
      </div>
    </div>
    {/* Bottom stat pills (shown when NOT hovered — hidden on hover as overlay takes over) */}
    <div
      className={`
        absolute bottom-2 left-2 right-2 flex items-end justify-between
        pointer-events-none z-10
        transition-opacity duration-250
        ${hovered ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
        <FiEye className="w-2.5 h-2.5" />{formatViewsShort(views)}
      </span>
      {duration && (
        <span className="text-[10px] font-bold text-white bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded-md tracking-wide">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  </>
));
ThumbnailBadges.displayName = 'ThumbnailBadges';
// ─────────────────────────────────────────────────────────────
// MAIN VIDEO CARD
// ─────────────────────────────────────────────────────────────
const VideoCard = ({
  video,
  size      = 'default',
  showDate  = false,
  showLikes = false,
  featured  = false,
  premium   = false,
  index     = 0,
  className = '',
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  // DOM ref for stacking-context management
  const cardDomRef = useRef(null);
  // Intersection observer — lazy load thumbnail
  const [intersectRef, , hasIntersected] = useIntersection({
    threshold:   0.05,
    rootMargin:  '300px',
    triggerOnce: true,
  });
  // Premium hover preview system — singleton, debounced, mobile-safe
  const {
    isPreviewActive,
    isTouch,
    handleMouseEnter,
    handleMouseLeave,
  } = useVideoPreview(video?._id || String(index), {
    delay:      480,
    leaveDelay: 180,
  });
  // Combine refs
  const setRefs = useCallback(
    (el) => {
      intersectRef(el);
      cardDomRef.current = el;
    },
    [intersectRef]
  );
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // No video elements to clean — thumbnail-based system
    };
  }, []);
  // Bring card to front via inline style when preview active
  // (z-index class alone can't beat sibling stacking without this)
  useEffect(() => {
    const el = cardDomRef.current;
    if (!el) return;
    if (isPreviewActive) {
      el.style.zIndex = '50';
    } else {
      // Delay reset so exit animation completes
      const t = setTimeout(() => {
        if (el) el.style.zIndex = '';
      }, 350);
      return () => clearTimeout(t);
    }
  }, [isPreviewActive]);
  const s           = CARD_SIZES[size] || CARD_SIZES.default;
  const staggerDelay = Math.min(index * 50, 500);
  // Only show preview overlay on default/large sizes, non-touch devices
  const showPreview = size !== 'small' && size !== 'wide' && !isTouch;
  if (!video) return null;
  const thumbUrl     = getThumbnailUrl(video);
  const watchUrl     = getWatchUrl(video);
  const duration     = video.duration;
  const title        = video.title || 'Untitled Video';
  const qualityLabel = getQualityLabel(video);
  const isHD         = video.quality === 'HD' || video.is_hd;
  const isPremium    = premium || video.premium || video.featured;
  const views        = video.views;
  const date         = formatDate(video.uploadDate || video.createdAt);
  return (
    <div
      ref={setRefs}
      className={`
        group relative ${s.card} animate-fade-in-up ${className}
        ${showPreview
          ? isPreviewActive
            ? 'video-card-preview-active'
            : 'video-card-preview-idle'
          : ''
        }
      `}
      style={{
        animationDelay:    `${staggerDelay}ms`,
        animationFillMode: 'both',
        position:          'relative',
      }}
      onMouseEnter={showPreview ? handleMouseEnter : undefined}
      onMouseLeave={showPreview ? handleMouseLeave : undefined}
    >
      <Link
        to={watchUrl}
        className="block"
        tabIndex={0}
        aria-label={`Watch ${title}`}
      >
        {/* ──────────────────────────────────────────────────────
            THUMBNAIL CONTAINER
        ────────────────────────────────────────────────────── */}
        <div
          className={`
            relative ${s.thumb} rounded-xl overflow-hidden bg-dark-300
            transition-shadow duration-300
            ${isPreviewActive ? 'preview-glow-border' : 'shadow-card group-hover:shadow-card-hover'}
          `}
        >
          {/* Thumbnail image — lazy loaded */}
          {hasIntersected && (
            <img
              src={imgError ? getFallbackThumb() : thumbUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-all duration-500
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
                ${isPreviewActive ? 'thumb-hover-active scale-[1.04]' : 'group-hover:scale-[1.02]'}
              `}
            />
          )}
          {/* Skeleton shimmer while loading */}
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton-shimmer bg-dark-300" />
          )}
          {/* Static gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[1]" />
          {/* Cinematic vignette on hover */}
          <div
            className={`
              absolute inset-0 pointer-events-none z-[1]
              transition-opacity duration-400
              ${isPreviewActive ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)',
            }}
          />
          {/* Red tint glow on hover */}
          <div
            className={`
              absolute inset-0 pointer-events-none z-[1]
              transition-opacity duration-400
              ${isPreviewActive ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(225,29,72,0.07) 0%, transparent 70%)',
            }}
          />
          {/* ── Badges (HD, Premium, Featured + stats) ─────────── */}
          <ThumbnailBadges
            isHD={isHD}
            qualityLabel={qualityLabel}
            isPremium={isPremium}
            featured={featured}
            views={views}
            duration={duration}
            hovered={isPreviewActive}
          />
          {/* ── Play button ──────────────────────────────────────── */}
          <PlayButtonOverlay visible={isPreviewActive || false} />
          {/* ── Hover info overlay ───────────────────────────────── */}
          {showPreview && (
            <HoverInfoOverlay
              video={video}
              visible={isPreviewActive}
              qualityLabel={qualityLabel}
            />
          )}
          {/* ── Active-hover red border sweep line (top) ─────────── */}
          <div
            className={`
              absolute top-0 left-0 right-0 h-[2px]
              bg-gradient-to-r from-transparent via-primary-500 to-transparent
              pointer-events-none z-10
              transition-opacity duration-500
              ${isPreviewActive ? 'opacity-100' : 'opacity-0'}
            `}
          />
        </div>
        {/* ──────────────────────────────────────────────────────
            INFO SECTION (below thumbnail)
        ────────────────────────────────────────────────────── */}
        <div
          className={`
            ${s.padding} pt-2.5
            transition-all duration-300
            ${isPreviewActive ? 'opacity-60 translate-y-0.5' : 'opacity-100 translate-y-0'}
          `}
        >
          {/* Title */}
          <h3
            className={`
              ${s.title} font-semibold leading-snug
              text-white/85 group-hover:text-white
              line-clamp-2 transition-colors duration-200 mb-1.5
              ${isPreviewActive ? 'text-white' : ''}
            `}
          >
            {title}
          </h3>
          {/* Meta row */}
          <div className={`flex items-center gap-2 ${s.meta} text-white/35 flex-wrap`}>
            {video.category && (
              <>
                <span className="text-primary-500/80 font-medium truncate max-w-[80px]">
                  {typeof video.category === 'string'
                    ? video.category
                    : video.category?.name || ''}
                </span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <FiEye className="w-2.5 h-2.5" />
              {formatViewsShort(views)}
            </span>
            {duration && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-2.5 h-2.5" />
                  {formatDuration(duration)}
                </span>
              </>
            )}
            {showDate && date && (
              <>
                <span className="text-white/20">·</span>
                <span className="hidden sm:inline">{date}</span>
              </>
            )}
            {showLikes && video.likes > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1 text-rose-400/70">
                  <FiHeart className="w-2.5 h-2.5" />
                  {formatViewsShort(video.likes)}
                </span>
              </>
            )}
          </div>
          {/* Inline tag chips — slide-in on hover */}
          {video.tags && video.tags.length > 0 && size !== 'small' && size !== 'wide' && (
            <div
              className={`
                flex gap-1.5 mt-2 overflow-hidden flex-wrap
                transition-all duration-300
                ${isPreviewActive ? 'opacity-0 max-h-0' : 'opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-8'}
              `}
            >
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-white/40 border border-white/[0.08] truncate max-w-[60px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
export default memo(VideoCard);
