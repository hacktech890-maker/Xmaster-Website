// src/components/home/TrendingTags.jsx
// Animated trending tags cloud for homepage
// Shows popular search tags as clickable chips

import React, { useState, useEffect } from 'react';
import { Link }         from 'react-router-dom';
import { FiTrendingUp, FiTag, FiHash } from 'react-icons/fi';

import { publicAPI }    from '../../services/api';
import { FREE_CONTENT_TAGS } from '../../config/studios';

// ============================================================
// TAG COLOR VARIANTS
// ============================================================

const TAG_COLORS = [
  'bg-primary-600/15 text-primary-400 border-primary-600/25 hover:bg-primary-600/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/25',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25',
  'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25',
  'bg-rose-500/15 text-rose-400 border-rose-500/25 hover:bg-rose-500/25',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/25',
  'bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-orange-500/25',
];

// ============================================================
// TRENDING TAGS COMPONENT
// ============================================================

const TrendingTags = ({
  title     = 'Trending Tags',
  tags      = null,      // override — use API tags by default
  maxTags   = 20,
  showCount = false,
  compact   = false,
  className = '',
}) => {
  const [apiTags, setApiTags] = useState([]);
  const [loading, setLoading] = useState(!tags);

  // Fetch popular tags from API if not provided
  useEffect(() => {
    if (tags) return;
    const fetchTags = async () => {
      try {
        const res  = await publicAPI.getPopularTags(maxTags);
        const data = res?.data?.tags || res?.data || [];
        setApiTags(Array.isArray(data) ? data : []);
      } catch {
        // Fallback to hardcoded tags
        setApiTags(FREE_CONTENT_TAGS.map((t) => ({ name: t, count: 0 })));
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [tags, maxTags]);

  const displayTags = (tags || apiTags).slice(0, maxTags);

  if (loading) {
    return <TagsSkeleton compact={compact} className={className} />;
  }

  if (!displayTags.length) return null;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <section className={`space-y-3 ${className}`}>

      {/* Header */}
      {title && (
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 flex-shrink-0" />
          <FiTrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className={`font-bold text-white ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
            {title}
          </h2>
        </div>
      )}

      {/* Tags cloud */}
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, i) => {
          const tagName  = typeof tag === 'string' ? tag : tag.name || tag.tag || '';
          const tagCount = typeof tag === 'object' ? tag.count || 0 : 0;
          const colorClass = TAG_COLORS[i % TAG_COLORS.length];
          const delay      = Math.min(i * 30, 600);
          const isLarge    = i < 3;
          const isMed      = i >= 3 && i < 8;

          return (
            <Link
              key={tagName || i}
              to={`/tag/${encodeURIComponent(tagName)}`}
              className={`
                inline-flex items-center gap-1.5
                border rounded-full
                font-medium
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_4px_15px_rgba(0,0,0,0.3)]
                animate-fade-in
                ${colorClass}
                ${isLarge
                  ? compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                  : isMed
                    ? compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
                    : compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                }
              `}
              style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
            >
              <FiHash className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
              {tagName}
              {showCount && tagCount > 0 && (
                <span className="opacity-50 text-[10px]">
                  {tagCount > 999 ? `${(tagCount / 1000).toFixed(1)}k` : tagCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

// ============================================================
// TAGS SKELETON
// ============================================================

const TagsSkeleton = ({ compact = false, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 rounded-full skeleton-shimmer bg-dark-200" />
      <div className="h-5 w-32 rounded skeleton-shimmer bg-dark-200" />
    </div>
    <div className="flex flex-wrap gap-2">
      {[80, 65, 90, 55, 70, 60, 85, 50, 75, 60, 70, 55].map((w, i) => (
        <div
          key={i}
          className={`
            rounded-full skeleton-shimmer bg-dark-300
            ${compact ? 'h-6' : 'h-7'}
          `}
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  </div>
);

export default TrendingTags;