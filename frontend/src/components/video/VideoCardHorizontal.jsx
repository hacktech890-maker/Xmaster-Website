// src/components/video/VideoCardHorizontal.jsx
import React, { useState } from 'react';
import { Link }       from 'react-router-dom';
import { FiPlay, FiEye, FiClock } from 'react-icons/fi';

import {
  getThumbnailUrl,
  formatDuration,
  formatViewsShort,
  formatDate,
  getWatchUrl,
  truncateText,
} from '../../utils/helpers';
import { useIntersection } from '../../hooks/useIntersection';
import { HDBadge } from '../common/Badge';

const SIZES = {
  sm: { thumb: 'w-24 sm:w-28', height: 'h-14 sm:h-16', title: 'text-xs',  meta: 'text-[10px]' },
  md: { thumb: 'w-36 sm:w-44', height: 'h-20 sm:h-24', title: 'text-sm',  meta: 'text-xs'     },
  lg: { thumb: 'w-48 sm:w-56', height: 'h-24 sm:h-28', title: 'text-base',meta: 'text-sm'     },
};

const VideoCardHorizontal = ({
  video,
  size       = 'md',
  showBadges = true,
  showDate   = true,
  showDesc   = false,
  actions    = null,
  className  = '',
  index      = 0,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const [hovered,   setHovered]   = useState(false);

  const [cardRef, , hasIntersected] = useIntersection({
    threshold: 0.05, rootMargin: '100px', triggerOnce: true,
  });

  const s = SIZES[size] || SIZES.md;
  if (!video) return null;

  const thumbUrl = getThumbnailUrl(video);
  const watchUrl = getWatchUrl(video);
  const duration = formatDuration(video.duration);
  const views    = formatViewsShort(video.views);
  const date     = formatDate(video.uploadDate || video.createdAt);
  const isHD     = video.quality === 'HD' || video.is_hd;
  const staggerDelay = Math.min(index * 40, 400);

  return (
    <div
      ref={cardRef}
      className={`group flex gap-3 sm:gap-4 p-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all duration-200 animate-fade-in-up ${className}`}
      style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'both' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        to={watchUrl}
        aria-label={`Watch ${video.title}`}
        className={`relative flex-shrink-0 ${s.thumb} ${s.height} rounded-lg overflow-hidden bg-dark-300`}
      >
        {hasIntersected && (
          <img
            src={imgError ? getFallbackThumb() : thumbUrl}
            alt={video.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={`w-full h-full object-cover transition-all duration-400 group-hover:scale-[1.05] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {!imgLoaded && <div className="absolute inset-0 skeleton-shimmer bg-dark-300" />}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-250 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-8 h-8 rounded-full bg-primary-600/90 flex items-center justify-center border border-white/20">
            <FiPlay className="w-3.5 h-3.5 text-white fill-white ml-px" />
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-black/80 px-1 py-px rounded">
            {duration}
          </span>
        )}
        {showBadges && isHD && <span className="absolute top-1 left-1"><HDBadge /></span>}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link to={watchUrl} className="block">
          <h3 className={`${s.title} font-semibold leading-snug text-white/80 group-hover:text-white line-clamp-2 mb-1.5 transition-colors duration-200`}>
            {video.title}
          </h3>
          {showDesc && video.description && (
            <p className="text-xs text-white/35 line-clamp-2 mb-1.5 leading-relaxed">
              {truncateText(video.description, 100)}
            </p>
          )}
          <div className={`flex flex-wrap items-center gap-2 ${s.meta} text-white/35`}>
            {video.category && (
              <span className="text-primary-500/70 font-medium">
                {typeof video.category === 'string' ? video.category : video.category?.name || ''}
              </span>
            )}
            <span className="flex items-center gap-1"><FiEye className="w-2.5 h-2.5" />{views}</span>
            {duration && size !== 'sm' && (
              <span className="flex items-center gap-1"><FiClock className="w-2.5 h-2.5" />{duration}</span>
            )}
            {showDate && date && <span className="hidden sm:inline">{date}</span>}
          </div>
          {video.tags && video.tags.length > 0 && size === 'lg' && (
            <div className="flex flex-wrap gap-1 mt-2">
              {video.tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.06] text-white/40 hover:bg-primary-600/15 hover:text-white/70 border border-white/[0.08] transition-colors duration-150"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </Link>
      </div>

      {actions && <div className="flex-shrink-0 flex items-center">{actions}</div>}
    </div>
  );
};

const getFallbackThumb = () =>
  `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90">
      <rect width="160" height="90" fill="#141414"/>
      <polygon points="62,30 98,45 62,60" fill="#e11d48" opacity="0.6"/>
    </svg>
  `)}`;

export const VideoCardHorizontalSkeleton = ({ size = 'md', className = '' }) => {
  const s = SIZES[size] || SIZES.md;
  return (
    <div className={`flex gap-3 sm:gap-4 p-2 animate-pulse ${className}`}>
      <div className={`flex-shrink-0 ${s.thumb} ${s.height} rounded-lg skeleton-shimmer bg-dark-300`} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded skeleton-shimmer bg-dark-200 w-full" />
        <div className="h-4 rounded skeleton-shimmer bg-dark-200 w-4/5" />
        <div className="flex gap-2 mt-1">
          <div className="h-3 w-16 rounded skeleton-shimmer bg-dark-300" />
          <div className="h-3 w-12 rounded skeleton-shimmer bg-dark-300" />
          <div className="h-3 w-20 rounded skeleton-shimmer bg-dark-300" />
        </div>
      </div>
    </div>
  );
};

export default VideoCardHorizontal;