// src/components/video/VideoCardSkeleton.jsx
// Skeleton loader for VideoCard — matches exact card layout
// Used during data loading states throughout the app

import React from 'react';

// ============================================================
// SINGLE SKELETON CARD
// ============================================================

const VideoCardSkeleton = ({
  size      = 'default',
  className = '',
}) => {
  const isWide  = size === 'wide';
  const isSmall = size === 'small';

  return (
    <div className={`
      ${isWide ? 'w-48 sm:w-56 md:w-64 flex-shrink-0' : 'w-full'}
      animate-pulse
      ${className}
    `}>
      {/* Thumbnail */}
      <div className={`
        relative aspect-video rounded-xl overflow-hidden
        skeleton-shimmer bg-dark-300
      `} />

      {/* Info */}
      <div className={`${isSmall ? 'p-2' : 'p-3'} pt-2.5 space-y-2`}>
        {/* Title line 1 */}
        <div className={`
          h-3.5 rounded-lg skeleton-shimmer bg-dark-200
          ${isSmall ? 'w-full' : 'w-full'}
        `} />
        {/* Title line 2 */}
        <div className={`
          h-3.5 rounded-lg skeleton-shimmer bg-dark-200
          ${isSmall ? 'w-2/3' : 'w-3/4'}
        `} />

        {/* Meta */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-2.5 w-16 rounded skeleton-shimmer bg-dark-300" />
          <div className="h-2.5 w-1 rounded skeleton-shimmer bg-dark-300" />
          <div className="h-2.5 w-12 rounded skeleton-shimmer bg-dark-300" />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// GRID OF SKELETONS
// ============================================================

export const VideoGridSkeleton = ({
  count     = 12,
  size      = 'default',
  columns   = null,    // override grid columns
  className = '',
}) => {
  const gridCols = columns || (
    size === 'wide'
      ? 'flex gap-4 overflow-hidden'
      : 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5'
  );

  return (
    <div className={`${gridCols} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} size={size} />
      ))}
    </div>
  );
};

// ============================================================
// HORIZONTAL ROW SKELETON (for SectionRow)
// ============================================================

export const RowSkeleton = ({
  count     = 6,
  className = '',
}) => (
  <div className={`flex gap-4 overflow-hidden ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <VideoCardSkeleton key={i} size="wide" />
    ))}
  </div>
);

// ============================================================
// HERO SKELETON
// ============================================================

export const HeroSkeleton = ({ className = '' }) => (
  <div className={`
    relative w-full rounded-2xl overflow-hidden
    bg-dark-300 skeleton-shimmer
    ${className}
  `}
    style={{ aspectRatio: '21/9', minHeight: '320px' }}
  >
    {/* Overlay content skeleton */}
    <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12">
      <div className="space-y-3 max-w-lg">
        <div className="h-3 w-24 rounded skeleton-shimmer bg-white/10" />
        <div className="h-7 w-full rounded-lg skeleton-shimmer bg-white/10" />
        <div className="h-7 w-2/3 rounded-lg skeleton-shimmer bg-white/10" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer bg-white/10 mt-2" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-32 rounded-xl skeleton-shimmer bg-white/10" />
          <div className="h-10 w-24 rounded-xl skeleton-shimmer bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// WATCH PAGE SKELETON
// ============================================================

export const WatchPageSkeleton = ({ className = '' }) => (
  <div className={`
    grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6
    ${className}
  `}>
    {/* Left: player + info */}
    <div className="space-y-4">
      {/* Player */}
      <div className="aspect-video rounded-xl skeleton-shimmer bg-dark-300" />

      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 w-4/5 rounded-lg skeleton-shimmer bg-dark-200" />
        <div className="h-6 w-1/2 rounded-lg skeleton-shimmer bg-dark-200" />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 pt-1">
        <div className="h-4 w-20 rounded skeleton-shimmer bg-dark-300" />
        <div className="h-4 w-16 rounded skeleton-shimmer bg-dark-300" />
        <div className="h-4 w-24 rounded skeleton-shimmer bg-dark-300 ml-auto" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        {[80, 80, 80, 100].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-xl skeleton-shimmer bg-dark-300"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>

    {/* Right: related sidebar */}
    <div className="space-y-3">
      <div className="h-5 w-24 rounded skeleton-shimmer bg-dark-200" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-2">
          <div className="w-28 h-16 rounded-lg flex-shrink-0 skeleton-shimmer bg-dark-300" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded skeleton-shimmer bg-dark-200" />
            <div className="h-3 w-3/4 rounded skeleton-shimmer bg-dark-200" />
            <div className="h-2.5 w-1/2 rounded skeleton-shimmer bg-dark-300" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default VideoCardSkeleton;