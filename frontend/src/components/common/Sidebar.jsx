// src/components/common/Sidebar.jsx
// Content sidebar for WatchPage — related videos + tags
// Was previously an empty 54-byte stub

import React from 'react';
import { Link } from 'react-router-dom';
import { FiTag, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import { getThumbnailUrl, formatDuration, formatViews } from '../../utils/helpers';
import { getWatchUrl } from '../../utils/helpers';

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

const Sidebar = ({
  relatedVideos = [],
  popularTags   = [],
  loading       = false,
  title         = 'Up Next',
}) => {
  return (
    <aside className="space-y-6">

      {/* ── Related / Up Next ────────────────────────────── */}
      <div>
        <h3 className="section-title text-base mb-4">
          {title}
        </h3>

        {loading ? (
          // Skeleton
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SidebarVideoSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {relatedVideos.map((video) => (
              <SidebarVideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* ── Popular Tags ─────────────────────────────────── */}
      {popularTags.length > 0 && (
        <div>
          <h3 className="section-title text-base mb-4">
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const tagName = typeof tag === 'string' ? tag : tag.name || tag.tag;
              return (
                <Link
                  key={tagName}
                  to={`/tag/${encodeURIComponent(tagName)}`}
                  className="
                    flex items-center gap-1
                    px-2.5 py-1 rounded-lg text-xs
                    bg-white/6 hover:bg-primary-600/15
                    border border-white/8 hover:border-primary-600/25
                    text-white/50 hover:text-white
                    transition-all duration-200
                  "
                >
                  <FiTag className="w-2.5 h-2.5" />
                  {tagName}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

// ============================================================
// SIDEBAR VIDEO CARD
// ============================================================

const SidebarVideoCard = ({ video }) => {
  const thumb = getThumbnailUrl(video);
  const url   = getWatchUrl(video);

  return (
    <Link
      to={url}
      className="
        flex gap-3 p-2 rounded-xl
        hover:bg-white/5
        transition-all duration-200
        group
      "
    >
      {/* Thumbnail */}
      <div className="
        relative flex-shrink-0
        w-28 h-16 rounded-lg overflow-hidden
        bg-dark-300
      ">
        <img
          src={thumb}
          alt={video.title}
          loading="lazy"
          className="
            w-full h-full object-cover
            group-hover:scale-105
            transition-transform duration-300
          "
          onError={(e) => {
            e.target.src = `data:image/svg+xml;base64,${btoa(
              '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="64" viewBox="0 0 112 64"><rect width="112" height="64" fill="#1a1a1a"/><polygon points="42,22 70,32 42,42" fill="#e11d48" opacity="0.6"/></svg>'
            )}`;
          }}
        />
        {/* Duration */}
        {video.duration && (
          <span className="
            absolute bottom-1 right-1
            px-1 py-px rounded text-[9px] font-semibold
            bg-black/80 text-white
          ">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="
          text-xs font-semibold text-white/80
          group-hover:text-white
          line-clamp-2 leading-snug mb-1
          transition-colors duration-200
        ">
          {video.title}
        </h4>
        <p className="text-[10px] text-white/35">
          {formatViews(video.views)}
        </p>
      </div>
    </Link>
  );
};

// ============================================================
// SKELETON
// ============================================================

const SidebarVideoSkeleton = () => (
  <div className="flex gap-3 p-2">
    <div className="
      flex-shrink-0 w-28 h-16 rounded-lg
      skeleton-shimmer bg-dark-300
    " />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-3 rounded skeleton-shimmer bg-dark-200 w-full" />
      <div className="h-3 rounded skeleton-shimmer bg-dark-200 w-3/4" />
      <div className="h-2.5 rounded skeleton-shimmer bg-dark-300 w-1/2 mt-2" />
    </div>
  </div>
);

export default Sidebar;