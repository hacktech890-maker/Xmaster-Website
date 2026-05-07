// src/components/video/VideoGrid.jsx
import React from 'react';
import { FiAlertCircle, FiVideo, FiRefreshCw } from 'react-icons/fi';

import VideoCard                            from './VideoCard';
import { VideoGridSkeleton }               from './VideoCardSkeleton';
import Pagination                          from '../common/Pagination';

const GRID_PRESETS = {
  default: `grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5`,
  wide:    `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`,
  compact: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4`,
  featured:`grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6`,
};

const VideoGrid = ({
  videos         = [],
  loading        = false,
  error          = null,
  onRetry        = null,
  currentPage    = 1,
  totalPages     = 1,
  onPageChange   = null,
  showPagination = false,
  skeletonCount  = 12,
  columns        = 'default',
  cardSize       = 'default',
  showDate       = false,
  showLikes      = false,
  emptyTitle     = 'No videos found',
  emptyMessage   = 'Try a different search or check back later.',
  emptyIcon      = null,
  className      = '',
}) => {
  const gridClass = GRID_PRESETS[columns] || GRID_PRESETS.default;

  if (loading) {
    return <div className={className}><VideoGridSkeleton count={skeletonCount} size={cardSize} /></div>;
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
        <div className="w-16 h-16 rounded-2xl mb-5 bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <FiAlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Failed to load videos</h3>
        <p className="text-sm text-white/40 text-center max-w-xs mb-6">
          {typeof error === 'string' ? error : 'Something went wrong. Please try again.'}
        </p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" />Try Again
          </button>
        )}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
        <div className="w-16 h-16 rounded-2xl mb-5 bg-white/5 border border-white/[0.08] flex items-center justify-center">
          {emptyIcon || <FiVideo className="w-7 h-7 text-white/20" />}
        </div>
        <h3 className="text-lg font-bold text-white/60 mb-2">{emptyTitle}</h3>
        <p className="text-sm text-white/30 text-center max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={gridClass}>
        {videos.map((video, i) => (
          <VideoCard
            key={video._id || i}
            video={video}
            size={cardSize}
            index={i}
            showDate={showDate}
            showLikes={showLikes}
          />
        ))}
      </div>
      {showPagination && totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default VideoGrid;