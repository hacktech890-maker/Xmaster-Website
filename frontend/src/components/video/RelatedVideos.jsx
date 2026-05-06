// src/components/video/RelatedVideos.jsx
// Modern related videos section
// Used in WatchPage — sticky sidebar on desktop, row on mobile

import React, { useState } from 'react';
import { Link }         from 'react-router-dom';
import { FiChevronRight, FiRefreshCw } from 'react-icons/fi';

import VideoCardHorizontal, {
  VideoCardHorizontalSkeleton,
} from './VideoCardHorizontal';
import VideoCard from './VideoCard';
import { VideoGridSkeleton } from './VideoCardSkeleton';

// ============================================================
// RELATED VIDEOS COMPONENT
// ============================================================

const RelatedVideos = ({
  videos    = [],
  loading   = false,
  error     = null,
  onRetry   = null,
  title     = 'Related Videos',
  // Layout: 'sidebar' (horizontal cards) | 'grid' (grid cards) | 'row' (horizontal scroll)
  layout    = 'sidebar',
  maxItems  = 15,
  className = '',
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayVideos = showAll
    ? videos.slice(0, maxItems)
    : videos.slice(0, layout === 'sidebar' ? 10 : 6);

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={className}>
        <SectionHeader title={title} />
        {layout === 'sidebar' && (
          <div className="space-y-1 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoCardHorizontalSkeleton key={i} size="sm" />
            ))}
          </div>
        )}
        {layout === 'grid' && (
          <VideoGridSkeleton count={6} className="mt-4" />
        )}
        {layout === 'row' && (
          <div className="flex gap-4 mt-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <VideoCardHorizontalSkeleton key={i} size="md" className="w-48 flex-shrink-0" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`${className} py-8 text-center`}>
        <p className="text-sm text-white/40 mb-3">
          Could not load related videos
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-ghost flex items-center gap-2 mx-auto text-sm"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────
  if (!videos || videos.length === 0) {
    return null;
  }

  // ── Sidebar layout ─────────────────────────────────────────
  if (layout === 'sidebar') {
    return (
      <div className={className}>
        <SectionHeader title={title} />

        <div className="mt-3 space-y-0.5">
          {displayVideos.map((video, i) => (
            <VideoCardHorizontal
              key={video._id || i}
              video={video}
              size="sm"
              showDate={false}
              index={i}
            />
          ))}
        </div>

        {/* Show more */}
        {videos.length > displayVideos.length && (
          <button
            onClick={() => setShowAll(true)}
            className="
              w-full mt-3 py-2.5 rounded-xl
              text-xs font-medium text-white/40
              hover:text-white/70
              hover:bg-white/5
              border border-white/6
              hover:border-white/12
              flex items-center justify-center gap-1.5
              transition-all duration-200
            "
          >
            Show more
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ── Grid layout ────────────────────────────────────────────
  if (layout === 'grid') {
    return (
      <div className={className}>
        <SectionHeader title={title} />
        <div className="
          grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
          gap-4 mt-4
        ">
          {displayVideos.map((video, i) => (
            <VideoCard
              key={video._id || i}
              video={video}
              size="default"
              index={i}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Row layout (horizontal scroll) ────────────────────────
  if (layout === 'row') {
    return (
      <div className={className}>
        <SectionHeader title={title} />
        <div className="
          flex gap-4 mt-4
          overflow-x-auto no-scrollbar
          pb-2
        ">
          {displayVideos.map((video, i) => (
            <VideoCard
              key={video._id || i}
              video={video}
              size="wide"
              index={i}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================
// SECTION HEADER
// ============================================================

const SectionHeader = ({ title, link, linkLabel = 'See all' }) => (
  <div className="flex items-center justify-between mb-1">
    <h3 className="section-title text-sm sm:text-base">
      {title}
    </h3>
    {link && (
      <Link
        to={link}
        className="
          text-xs text-white/40 hover:text-primary-400
          flex items-center gap-1
          transition-colors duration-200
        "
      >
        {linkLabel}
        <FiChevronRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

export default RelatedVideos;