// src/components/video/VideoCard.jsx
import React, { useState } from 'react';
import { Link }          from 'react-router-dom';
import { FiPlay, FiEye, FiClock, FiHeart, FiStar } from 'react-icons/fi';

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
  default: { card: 'w-full', thumb: 'aspect-video', title: 'text-sm',   meta: 'text-xs',    padding: 'p-3'   },
  large:   { card: 'w-full', thumb: 'aspect-video', title: 'text-base', meta: 'text-xs',    padding: 'p-4'   },
  small:   { card: 'w-full', thumb: 'aspect-video', title: 'text-xs',   meta: 'text-[10px]',padding: 'p-2.5' },
  wide:    { card: 'w-48 sm:w-56 md:w-64 flex-shrink-0', thumb: 'aspect-video', title: 'text-xs', meta: 'text-[10px]', padding: 'p-2.5' },
};

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

  const [cardRef, , hasIntersected] = useIntersection({
    threshold: 0.1, rootMargin: '200px', triggerOnce: true,
  });

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

  return (
    <div
      ref={cardRef}
      className={`group relative ${s.card} animate-fade-in-up ${className}`}
      style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'both' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="w-12 h-12 rounded-full bg-primary-600/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.5)] border-2 border-white/20">
              <FiPlay className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
            <div className="flex gap-1.5">
              {isHD      && <HDBadge />}
              {isPremium && <PremiumBadge size="xs">PREMIUM</PremiumBadge>}
              {featured  && <Badge variant="primary" size="xs"><FiStar className="w-2.5 h-2.5" />Featured</Badge>}
            </div>
          </div>

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