// src/components/home/SectionRow.jsx
// Reusable horizontal scrollable video section
// Used throughout homepage for: Trending, Latest, Recommended, etc.

import React, { useRef, useState, useCallback } from 'react';
import { Link }   from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight,
  FiTrendingUp, FiClock, FiStar,
  FiZap, FiAward, FiHeart,
  FiEye, FiGrid,
} from 'react-icons/fi';

import VideoCard                  from '../video/VideoCard';
import { RowSkeleton }            from '../video/VideoCardSkeleton';

// ============================================================
// SECTION ICON MAP
// ============================================================

const SECTION_ICONS = {
  trending:   <FiTrendingUp className="w-4 h-4 text-primary-500" />,
  latest:     <FiClock      className="w-4 h-4 text-blue-400" />,
  featured:   <FiStar       className="w-4 h-4 text-amber-400" />,
  premium:    <FiAward      className="w-4 h-4 text-purple-400" />,
  popular:    <FiEye        className="w-4 h-4 text-emerald-400" />,
  new:        <FiZap        className="w-4 h-4 text-cyan-400" />,
  loved:      <FiHeart      className="w-4 h-4 text-rose-400" />,
  all:        <FiGrid       className="w-4 h-4 text-white/40" />,
};

// ============================================================
// SECTION ROW COMPONENT
// ============================================================

const SectionRow = ({
  title,
  videos      = [],
  loading     = false,
  error       = null,
  seeAllLink  = null,
  seeAllLabel = 'See All',
  icon        = 'all',       // key from SECTION_ICONS
  accentColor = null,        // custom CSS color for accent line
  badge       = null,        // text badge beside title
  skeletonCount = 8,
  cardSize    = 'wide',      // VideoCard size prop
  className   = '',
  // Scroll behavior
  scrollAmount = 300,
}) => {
  const rowRef      = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(true);

  // ── Scroll handler ─────────────────────────────────────────
  const updateScrollBtns = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 8);
    setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scrollLeft = useCallback(() => {
    rowRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    setTimeout(updateScrollBtns, 350);
  }, [scrollAmount, updateScrollBtns]);

  const scrollRight = useCallback(() => {
    rowRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateScrollBtns, 350);
  }, [scrollAmount, updateScrollBtns]);

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <section className={`space-y-4 ${className}`}>
        <SectionHeader
          title={title}
          icon={icon}
          badge={badge}
          accentColor={accentColor}
          loading
        />
        <RowSkeleton count={skeletonCount} />
      </section>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <section className={`space-y-4 ${className}`}>
        <SectionHeader title={title} icon={icon} badge={badge} accentColor={accentColor} />
        <div className="
          h-40 rounded-xl
          bg-white/[0.02] border border-white/5
          flex items-center justify-center
        ">
          <p className="text-sm text-white/30">
            Could not load videos
          </p>
        </div>
      </section>
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (!videos || videos.length === 0) return null;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <section className={`space-y-4 ${className}`}>

      {/* ── Header ─────────────────────────────────────────── */}
      <SectionHeader
        title={title}
        icon={icon}
        badge={badge}
        accentColor={accentColor}
        seeAllLink={seeAllLink}
        seeAllLabel={seeAllLabel}
        canScrollL={canScrollL}
        canScrollR={canScrollR}
        onScrollL={scrollLeft}
        onScrollR={scrollRight}
        showArrows={videos.length > 4}
      />

      {/* ── Scroll row ─────────────────────────────────────── */}
      <div className="relative group/row">

        {/* Left fade mask */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-10
          bg-gradient-to-r from-dark-400 to-transparent
          pointer-events-none z-10
          transition-opacity duration-200
          ${canScrollL ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Right fade mask */}
        <div className={`
          absolute right-0 top-0 bottom-0 w-16
          bg-gradient-to-l from-dark-400 to-transparent
          pointer-events-none z-10
          transition-opacity duration-200
          ${canScrollR ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Scrollable row */}
        <div
          ref={rowRef}
          onScroll={updateScrollBtns}
          className="
            flex gap-3 sm:gap-4
            overflow-x-auto no-scrollbar
            pb-1 -mx-1 px-1
            scroll-smooth
          "
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {videos.map((video, i) => (
            <div
              key={video._id || i}
              style={{ scrollSnapAlign: 'start' }}
              className="flex-shrink-0 w-44 sm:w-52 md:w-60"
            >
              <VideoCard
                video={video}
                size={cardSize}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// SECTION HEADER
// ============================================================

const SectionHeader = ({
  title,
  icon          = 'all',
  badge         = null,
  accentColor   = null,
  seeAllLink    = null,
  seeAllLabel   = 'See All',
  loading       = false,
  showArrows    = false,
  canScrollL    = false,
  canScrollR    = true,
  onScrollL,
  onScrollR,
}) => {
  const iconEl = SECTION_ICONS[icon] || SECTION_ICONS.all;

  return (
    <div className="flex items-center justify-between gap-4">

      {/* Left: icon + title + badge */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Accent line */}
        <div
          className="w-1 h-6 rounded-full flex-shrink-0"
          style={{ background: accentColor || '#e11d48' }}
        />

        {/* Icon */}
        <span className="flex-shrink-0">
          {iconEl}
        </span>

        {/* Title */}
        <h2 className="
          text-base sm:text-lg font-bold text-white
          truncate
        ">
          {title}
        </h2>

        {/* Badge */}
        {badge && !loading && (
          <span className="
            flex-shrink-0
            px-2 py-0.5 rounded-full
            text-[10px] font-bold uppercase tracking-wider
            bg-primary-600/20 text-primary-400
            border border-primary-600/30
          ">
            {badge}
          </span>
        )}
      </div>

      {/* Right: see all + scroll arrows */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Scroll arrows (desktop) */}
        {showArrows && (
          <div className="hidden sm:flex items-center gap-1">
            <ScrollArrowBtn
              direction="left"
              disabled={!canScrollL}
              onClick={onScrollL}
            />
            <ScrollArrowBtn
              direction="right"
              disabled={!canScrollR}
              onClick={onScrollR}
            />
          </div>
        )}

        {/* See all link */}
        {seeAllLink && (
          <Link
            to={seeAllLink}
            className="
              flex items-center gap-1
              text-xs font-semibold
              text-white/40 hover:text-primary-400
              transition-colors duration-200
              whitespace-nowrap
            "
          >
            {seeAllLabel}
            <FiChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

// ============================================================
// SCROLL ARROW BUTTON
// ============================================================

const ScrollArrowBtn = ({ direction, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
    className={`
      w-7 h-7 rounded-lg
      flex items-center justify-center
      border transition-all duration-200
      ${disabled
        ? 'border-white/5 text-white/15 cursor-not-allowed'
        : 'border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20'
      }
    `}
  >
    {direction === 'left'
      ? <FiChevronLeft  className="w-4 h-4" />
      : <FiChevronRight className="w-4 h-4" />
    }
  </button>
);

export default SectionRow;