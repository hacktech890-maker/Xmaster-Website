// src/components/admin/VideoTable.jsx
// Reusable admin video table component
// Used by VideosManager and other admin pages that need video lists

import React, { useState } from 'react';
import { Link }  from 'react-router-dom';
import {
  FiTrash2, FiEye, FiStar, FiExternalLink,
  FiEdit2, FiCheckSquare, FiSquare,
  FiChevronUp, FiChevronDown,
} from 'react-icons/fi';

import {
  getThumbnailUrl,
  formatViewsShort,
  formatDate,
  formatDuration,
  getWatchUrl,
} from '../../utils/helpers';

// ============================================================
// VIDEO TABLE COMPONENT
// ============================================================

const VideoTable = ({
  videos        = [],
  loading       = false,
  selected      = new Set(),
  onSelect      = null,
  onSelectAll   = null,
  onDelete      = null,
  onStatusToggle= null,
  onFeatureToggle=null,
  onEdit        = null,
  sortField     = null,
  sortDir       = 'desc',
  onSort        = null,
  showCheckbox  = true,
  showActions   = true,
  compact       = false,
  className     = '',
}) => {
  // ── Sort helpers ───────────────────────────────────────────
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FiChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <FiChevronUp   className="w-3 h-3 text-primary-400" />
      : <FiChevronDown className="w-3 h-3 text-primary-400" />;
  };

  const ThSort = ({ field, label, className: cn = '' }) => (
    <th
      className={`cursor-pointer select-none ${cn}`}
      onClick={() => onSort?.(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {onSort && <SortIcon field={field} />}
      </span>
    </th>
  );

  const allSelected = videos.length > 0 && selected.size === videos.length;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="admin-table w-full">
        <thead>
          <tr>
            {showCheckbox && (
              <th className="w-10 pl-4">
                <button
                  onClick={onSelectAll}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  {allSelected
                    ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
                    : <FiSquare      className="w-4 h-4" />
                  }
                </button>
              </th>
            )}
            <th className="min-w-[260px]">
              <ThSort field="title" label="Video" />
            </th>
            <th className="w-24">
              <ThSort field="status" label="Status" />
            </th>
            <th className="w-24">
              <ThSort field="views" label="Views" />
            </th>
            {!compact && (
              <th className="w-20">Duration</th>
            )}
            <th className="w-28">
              <ThSort field="createdAt" label="Date" />
            </th>
            {showActions && (
              <th className="w-28 text-right pr-4">Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
                <SkeletonRow key={i} showCheckbox={showCheckbox} compact={compact} />
              ))
            : videos.map((video, i) => (
                <VideoRow
                  key={video._id || i}
                  video={video}
                  selected={selected.has(video._id)}
                  onSelect={onSelect ? () => onSelect(video._id) : null}
                  onDelete={onDelete ? () => onDelete(video._id) : null}
                  onStatusToggle={onStatusToggle ? () => onStatusToggle(video) : null}
                  onFeatureToggle={onFeatureToggle ? () => onFeatureToggle(video) : null}
                  onEdit={onEdit ? () => onEdit(video) : null}
                  showCheckbox={showCheckbox}
                  showActions={showActions}
                  compact={compact}
                />
              ))
          }
        </tbody>
      </table>

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-white/30">No videos to display</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VIDEO ROW
// ============================================================

const VideoRow = ({
  video, selected, onSelect,
  onDelete, onStatusToggle, onFeatureToggle, onEdit,
  showCheckbox, showActions, compact,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const thumb    = getThumbnailUrl(video);
  const watchUrl = getWatchUrl(video);

  return (
    <tr className={`
      transition-colors duration-150
      ${selected ? 'bg-primary-600/6' : 'hover:bg-white/[0.02]'}
    `}>
      {/* Checkbox */}
      {showCheckbox && (
        <td className="pl-4">
          <button
            onClick={onSelect}
            className="text-white/30 hover:text-white transition-colors"
          >
            {selected
              ? <FiCheckSquare className="w-4 h-4 text-primary-400" />
              : <FiSquare      className="w-4 h-4" />
            }
          </button>
        </td>
      )}

      {/* Video cell */}
      <td>
        <div className="flex items-center gap-3 py-1.5">
          {/* Thumbnail */}
          <div className="
            relative w-20 h-12 rounded-lg overflow-hidden
            flex-shrink-0 bg-dark-300
          ">
            <img
              src={thumb}
              alt={video.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`
                w-full h-full object-cover
                transition-opacity duration-300
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 skeleton-shimmer bg-dark-300" />
            )}
            {video.duration && (
              <span className="
                absolute bottom-0.5 right-0.5
                text-[9px] font-bold text-white
                bg-black/80 px-1 py-px rounded
              ">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="
              text-xs font-semibold text-white/80
              line-clamp-2 leading-snug
            ">
              {video.title || 'Untitled'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {video.featured && (
                <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                  <FiStar className="w-2.5 h-2.5 fill-amber-400" />
                  Featured
                </span>
              )}
              {video.category && (
                <span className="text-[9px] text-white/25">
                  {typeof video.category === 'string'
                    ? video.category
                    : video.category?.name || ''
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td>
        <button
          onClick={onStatusToggle}
          disabled={!onStatusToggle}
          className={`
            px-2 py-0.5 rounded-full
            text-[10px] font-bold border
            transition-all duration-150
            ${video.status === 'public'
              ? 'status-public  hover:bg-emerald-500/25'
              : video.status === 'private'
                ? 'status-private hover:bg-gray-500/25'
                : 'status-draft   hover:bg-amber-500/25'
            }
            ${!onStatusToggle ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
          {video.status || 'draft'}
        </button>
      </td>

      {/* Views */}
      <td>
        <span className="text-xs text-white/50">
          {formatViewsShort(video.views)}
        </span>
      </td>

      {/* Duration */}
      {!compact && (
        <td>
          <span className="text-xs text-white/40">
            {formatDuration(video.duration) || '—'}
          </span>
        </td>
      )}

      {/* Date */}
      <td>
        <span className="text-xs text-white/35">
          {formatDate(video.createdAt || video.uploadDate)}
        </span>
      </td>

      {/* Actions */}
      {showActions && (
        <td className="pr-4">
          <div className="flex items-center justify-end gap-1">
            {/* Feature toggle */}
            {onFeatureToggle && (
              <button
                onClick={onFeatureToggle}
                title={video.featured ? 'Unfeature' : 'Feature'}
                className={`
                  p-1.5 rounded-lg transition-all duration-150
                  ${video.featured
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-white/20 hover:text-amber-400 hover:bg-amber-500/10'
                  }
                `}
              >
                <FiStar className={`w-3.5 h-3.5 ${video.featured ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {/* Edit */}
            {onEdit && (
              <button
                onClick={onEdit}
                title="Edit"
                className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-150"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* View on site */}
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View on site"
              className="p-1.5 rounded-lg text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-150"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Delete */}
            {onDelete && (
              <button
                onClick={onDelete}
                title="Delete"
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};

// ============================================================
// SKELETON ROW
// ============================================================

const SkeletonRow = ({ showCheckbox, compact }) => (
  <tr className="animate-pulse">
    {showCheckbox && (
      <td className="pl-4">
        <div className="w-4 h-4 rounded skeleton-shimmer bg-dark-200" />
      </td>
    )}
    <td>
      <div className="flex items-center gap-3 py-1.5">
        <div className="w-20 h-12 rounded-lg skeleton-shimmer bg-dark-300 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-full" />
          <div className="h-3 rounded skeleton-shimmer bg-dark-300 w-2/3" />
        </div>
      </div>
    </td>
    <td><div className="h-4 w-14 rounded-full skeleton-shimmer bg-dark-300" /></td>
    <td><div className="h-3.5 w-10 rounded skeleton-shimmer bg-dark-300" /></td>
    {!compact && <td><div className="h-3.5 w-12 rounded skeleton-shimmer bg-dark-300" /></td>}
    <td><div className="h-3.5 w-20 rounded skeleton-shimmer bg-dark-300" /></td>
    <td className="pr-4">
      <div className="flex justify-end gap-2">
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
        <div className="w-6 h-6 rounded skeleton-shimmer bg-dark-300" />
      </div>
    </td>
  </tr>
);

export default VideoTable;