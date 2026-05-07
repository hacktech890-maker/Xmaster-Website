// src/components/video/VideoCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link }          from 'react-router-dom';
import { FiPlay, FiEye, FiClock, FiHeart, FiStar, FiTag } from 'react-icons/fi';
import {
  getThumbnailUrl,
  formatDuration,
  formatViewsShort,
  formatDate,
  getWatchUrl,
} from '../../utils/helpers';
import { useIntersection } from '../../hooks/useIntersection';
import Badge, { HDBadge, PremiumBadge } from '../common/Badge';
const CARD_SIZES = {
  default: { card: 'w-full', thumb: 'aspect-video', title: 'text-sm',    meta: 'text-xs',     padding: 'p-3'   },
  large:   { card: 'w-full', thumb: 'aspect-video', title: 'text-base',  meta: 'text-xs',     padding: 'p-4'   },
  small:   { card: 'w-full', thumb: 'aspect-video', title: 'text-xs',    meta: 'text-[10px]', padding: 'p-2.5' },
  wide:    { card: 'w-48 sm:w-56 md:w-64 flex-shrink-0', thumb: 'aspect-video', title: 'text-xs', meta: 'text-[10px]', padding: 'p-2.5' },
};
// ── Hover Preview Tooltip ────────────────────────────────────────────────────
const HoverPreview = ({ video, visible, parentRef }) => {
  const [position, setPosition] = useState('bottom'); // 'bottom' | 'top'
  const previewRef = useRef(null);
  useEffect(() => {
    if (!visible || !parentRef?.current || !previewRef?.current) return;
    const rect = parentRef.current.getBoundingClientRect();
    const previewH = previewRef.current.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < previewH + 12 && spaceAbove > previewH + 12) {
      setPosition('top');
    } else {
      setPosition('bottom');
    }
  }, [visible, parentRef]);
  if (!video) return null;
  const duration   = formatDuration(video.duration);
  const views      = formatViewsShort(video.views);
  const category   = typeof video.category === 'string' ? video.category : video.category?.name || '';
  const tags       = video.tags?.slice(0, 5) || [];
  const desc       = video.description?.trim();
  return (
    <div
      ref={previewRef}
      className={`
        absolute left-1/2 -translate-x-1/2 z-[400] w-64
        pointer-events-none select-none
        transition-all duration-200
        ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${position === 'bottom' ? 'top-[calc(100%+8px)]' : 'bottom-[calc(100%+8px)]'}
      `}
      aria-hidden="true"
    >
      {/* Arrow */}
      <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45
        bg-[#1a1a2e] border-white/10
        ${position === 'bottom'
          ? '-top-1.5 border-t border-l'
          : '-bottom-1.5 border-b border-r'}
      `} />
      {/* Card */}
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
           style={{ background: 'rgba(16,16,30,0.97)', backdropFilter: 'blur(20px)' }}>
        {/* Header row */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {category && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-600/20 text-primary-400 border border-primary-600/30 truncate max-w-[100px]">
                {category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            {duration && (
              <span className="flex items-center gap-1">
                <FiClock className="w-2.5 h-2.5" />{duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiEye className="w-2.5 h-2.5" />{views}
            </span>
          </div>
        </div>
        {/* Title */}
        <div className="px-3 pt-2.5">
          <p className="text-xs font-semibold text-white/90 line-clamp-2 leading-snug">
            {video.title || 'Untitled Video'}
          </p>
        </div>
        {/* Description / Synopsis */}
        {desc ? (
          <div className="px-3 pt-2">
            <p className="text-[10px] text-white/45 line-clamp-3 leading-relaxed">
              {desc}
            </p>
          </div>
        ) : (
          <div className="px-3 pt-2">
            <p className="text-[10px] text-white/25 italic line-clamp-2 leading-relaxed">
              No description available.
            </p>
          </div>
        )}
        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-3 pt-2.5 pb-3">
            <div className="flex items-center gap-1 flex-wrap">
              <FiTag className="w-2.5 h-2.5 text-white/25 flex-shrink-0" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-white/40 border border-white/[0.08] truncate max-w-[70px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* CTA */}
        <div className="mx-3 mb-3 mt-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-600/90 border border-primary-500/30">
          <FiPlay className="w-3 h-3 text-white fill-white" />
          <span className="text-[11px] font-bold text-white tracking-wide">Watch Now</span>
        </div>
      </div>
    </div>
  );
};
// ── Main VideoCard ───────────────────────────────────────────────────────────
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
  const [hovered,   setHovered]   = useState(false);
  const cardRef2 = useRef(null);
  const hoverTimer = useRef(null);
  const [cardRef, , hasIntersected] = useIntersection({
    threshold: 0.1, rootMargin: '200px', triggerOnce: true,
  });
  // Combine refs
  const setRefs = (el) => {
    cardRef(el);
    cardRef2.current = el;
  };
  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setHovered(true), 350);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovered(false);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const s = CARD_SIZES[size] || CARD_SIZES.default;
  if (!video) return null;
  const thumbUrl  = getThumbnailUrl(video);
  const watchUrl  = getWatchUrl(video);
  const duration  = formatDuration(video.duration);
  const views     = formatViewsShort(video.views);
  const date      = formatDate(video.uploadDate || video.createdAt);
  const title     = video.title || 'Untitled Video';
  const isHD      = video.quality === 'HD' || video.is_hd;
  const isPremium = premium || video.premium || video.featured;
  const staggerDelay = Math.min(index * 50, 500);
  // Only show preview for default/large sizes (not small/wide)
  const showPreview = size !== 'small' && size !== 'wide';
  return (
    <div
      ref={setRefs}
      className={`group relative ${s.card} animate-fade-in-up ${className}`}
      style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'both' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={watchUrl} className="block" tabIndex={0} aria-label={`Watch ${title}`}>
        <div className={`relative ${s.thumb} rounded-xl overflow-hidden bg-dark-300 shadow-card group-hover:shadow-card-hover transition-shadow duration-300`}>
          {hasIntersected && (
            <img
              src={imgError ? getFallbackThumb() : thumbUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.06] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {!imgLoaded && <div className="absolute inset-0 skeleton-shimmer bg-dark-300" />}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className={`absolute inset-0 bg-primary-600/10 transition-opacity duration-300 pointer-events-none ${hovered ? 'opacity-100' : 'opacity-0'}`} />
          {/* Play button overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="w-12 h-12 rounded-full bg-primary-600/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.5)] border-2 border-white/20">
              <FiPlay className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
            <div className="flex gap-1.5">
              {isHD      && <HDBadge />}
              {isPremium && <PremiumBadge size="xs">PREMIUM</PremiumBadge>}
              {featured  && <Badge variant="primary" size="xs"><FiStar className="w-2.5 h-2.5" />Featured</Badge>}
            </div>
          </div>
          {/* Views + Duration */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <FiEye className="w-2.5 h-2.5" />{views}
            </span>
            {duration && (
              <span className="text-[10px] font-bold text-white bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded-md tracking-wide">
                {duration}
              </span>
            )}
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600/80 transition-all duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        <div className={`${s.padding} pt-2.5`}>
          <h3 className={`${s.title} font-semibold leading-snug text-white/85 group-hover:text-white line-clamp-2 transition-colors duration-200 mb-1.5`}>
            {title}
          </h3>
          <div className={`flex items-center gap-2 ${s.meta} text-white/35`}>
            {video.category && (
              <>
                <span className="text-primary-500/80 font-medium truncate max-w-[80px]">
                  {typeof video.category === 'string' ? video.category : video.category?.name || ''}
                </span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span className="flex items-center gap-1"><FiEye className="w-2.5 h-2.5" />{views}</span>
            {duration && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1"><FiClock className="w-2.5 h-2.5" />{duration}</span>
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
                  <FiHeart className="w-2.5 h-2.5" />{formatViewsShort(video.likes)}
                </span>
              </>
            )}
          </div>
          {video.tags && video.tags.length > 0 && size !== 'small' && size !== 'wide' && (
            <div className={`flex gap-1.5 mt-2 overflow-hidden transition-all duration-300 ${hovered ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0'}`}>
              {video.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-white/40 border border-white/[0.08] truncate max-w-[60px]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      {/* Hover Preview Tooltip — outside the Link to avoid nesting issues */}
      {showPreview && (
        <HoverPreview
          video={video}
          visible={hovered}
          parentRef={cardRef2}
        />
      )}
    </div>
  );
};
const getFallbackThumb = () =>
  `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect width="320" height="180" fill="#141414"/>
      <rect x="125" y="65" width="70" height="50" rx="8" fill="#1a1a1a"/>
      <polygon points="142,78 170,90 142,102" fill="#e11d48" opacity="0.7"/>
      <text x="160" y="148" font-family="Inter,sans-serif" font-size="10" fill="#333" text-anchor="middle">No Preview</text>
    </svg>
  `)}`;
export default VideoCard;
