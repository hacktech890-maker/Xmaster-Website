// src/components/video/VideoCard.jsx
import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlay,
  FiEye,
  FiClock,
  FiHeart,
  FiStar,
} from 'react-icons/fi';
import {
  getThumbnailUrl,
  formatDuration,
  formatViewsShort,
  formatDate,
  getWatchUrl,
} from '../../utils/helpers';
import { useIntersection } from '../../hooks/useIntersection';
import Badge, { HDBadge }  from '../common/Badge';

// ─────────────────────────────────────────────────────────────
// CARD SIZE PRESETS
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
// QUALITY HELPERS
// ─────────────────────────────────────────────────────────────
const getQualityLabel = (video) => {
  if (video.quality === '4K' || video.is_4k)   return '4K';
  if (video.quality === 'FHD' || video.is_fhd) return 'FHD';
  if (video.quality === 'HD'  || video.is_hd)  return 'HD';
  return null;
};

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
// THUMBNAIL BADGES
// ─────────────────────────────────────────────────────────────
const ThumbnailBadges = memo(({
  isHD, qualityLabel, isPremium, featured, views, duration,
}) => (
  <>
    {/* Top-left badges */}
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

    {/* Bottom stat pills */}
    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none z-10">
      <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
        <FiEye className="w-2.5 h-2.5" />
        {formatViewsShort(views)}
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

  // Intersection observer — lazy load thumbnail
  const [intersectRef, , hasIntersected] = useIntersection({
    threshold:   0.05,
    rootMargin:  '300px',
    triggerOnce: true,
  });

  const s            = CARD_SIZES[size] || CARD_SIZES.default;
  const staggerDelay = Math.min(index * 50, 500);

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
      ref={intersectRef}
      className={`
        group relative ${s.card} animate-fade-in-up ${className}
      `}
      style={{
        animationDelay:    `${staggerDelay}ms`,
        animationFillMode: 'both',
      }}
    >
      <Link
        to={watchUrl}
        className="block"
        tabIndex={0}
        aria-label={`Watch ${title}`}
      >
        {/* ── THUMBNAIL ───────────────────────────────────── */}
        <div
          className={`
            relative ${s.thumb} rounded-xl overflow-hidden bg-dark-300
            shadow-card group-hover:shadow-card-hover
            transition-shadow duration-300
          `}
        >
          {/* Lazy-loaded thumbnail image */}
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
                group-hover:scale-[1.02]
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
              `}
            />
          )}

          {/* Skeleton shimmer while loading */}
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton-shimmer bg-dark-300" />
          )}

          {/* Static top gradient */}
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[1]" />

          {/* Static bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-[1]" />

          {/* Hover tint overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none z-[2]" />

          {/* Play icon on hover */}
          <div className="
            absolute inset-0 flex items-center justify-center
            pointer-events-none z-[3]
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          ">
            <div className="
              w-11 h-11 rounded-full
              flex items-center justify-center
              bg-primary-600/90 border-2 border-white/20
              shadow-[0_0_20px_rgba(225,29,72,0.4)]
              scale-90 group-hover:scale-100
              transition-transform duration-200
            ">
              <FiPlay className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Badges */}
          <ThumbnailBadges
            isHD={isHD}
            qualityLabel={qualityLabel}
            isPremium={isPremium}
            featured={featured}
            views={views}
            duration={duration}
          />
        </div>

        {/* ── INFO BELOW THUMBNAIL ────────────────────────── */}
        <div className={`${s.padding} pt-2.5`}>
          <h3
            className={`
              ${s.title} font-semibold leading-snug
              text-white/85 group-hover:text-white
              line-clamp-2 transition-colors duration-200 mb-1.5
            `}
          >
            {title}
          </h3>

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

          {/* Tag chips on hover */}
          {video.tags && video.tags.length > 0 && size !== 'small' && size !== 'wide' && (
            <div className="
              flex gap-1.5 mt-2 overflow-hidden flex-wrap
              opacity-0 max-h-0
              group-hover:opacity-100 group-hover:max-h-8
              transition-all duration-300
            ">
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