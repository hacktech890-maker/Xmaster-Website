// src/components/home/StudioRow.jsx
// Premium studio/channel showcase row
// Netflix-style horizontal studio cards

import React, { useRef, useState, useCallback } from 'react';
import { Link }   from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight,
  FiPlay, FiFilm,
} from 'react-icons/fi';

import { PREMIUM_STUDIOS, getFeaturedStudios } from '../../config/studios';

// ============================================================
// STUDIO ROW COMPONENT
// ============================================================

const StudioRow = ({
  title     = 'Premium Studios',
  studios   = null,    // override default studios list
  className = '',
  compact   = false,   // smaller cards
}) => {
  const rowRef      = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(true);

  const displayStudios = studios || PREMIUM_STUDIOS;

  const updateScrollBtns = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 8);
    setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scroll = useCallback((dir) => {
    const amount = compact ? 260 : 340;
    rowRef.current?.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    setTimeout(updateScrollBtns, 350);
  }, [compact, updateScrollBtns]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <section className={`space-y-4 ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 flex-shrink-0" />
          <FiFilm className="w-4 h-4 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">
            {title}
          </h2>
          <span className="
            px-2 py-0.5 rounded-full
            text-[10px] font-bold uppercase tracking-wider
            bg-amber-500/15 text-amber-400
            border border-amber-500/25
          ">
            Premium
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <ScrollArrowBtn
              direction="left"
              disabled={!canScrollL}
              onClick={() => scroll('left')}
            />
            <ScrollArrowBtn
              direction="right"
              disabled={!canScrollR}
              onClick={() => scroll('right')}
            />
          </div>
          <Link
            to="/premium"
            className="
              text-xs font-semibold
              text-white/40 hover:text-amber-400
              transition-colors duration-200
              flex items-center gap-1
            "
          >
            All Studios
            <FiChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Studios row */}
      <div className="relative">

        {/* Fade masks */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-8
          bg-gradient-to-r from-dark-400 to-transparent
          pointer-events-none z-10
          transition-opacity duration-200
          ${canScrollL ? 'opacity-100' : 'opacity-0'}
        `} />
        <div className={`
          absolute right-0 top-0 bottom-0 w-16
          bg-gradient-to-l from-dark-400 to-transparent
          pointer-events-none z-10
          transition-opacity duration-200
          ${canScrollR ? 'opacity-100' : 'opacity-0'}
        `} />

        <div
          ref={rowRef}
          onScroll={updateScrollBtns}
          className="
            flex gap-3 sm:gap-4
            overflow-x-auto no-scrollbar pb-1
          "
        >
          {displayStudios.map((studio, i) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              compact={compact}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// STUDIO CARD
// ============================================================

const StudioCard = ({ studio, compact = false, index = 0 }) => {
  const [hovered, setHovered] = useState(false);

  const cardW  = compact ? 'w-36 sm:w-44' : 'w-44 sm:w-56';
  const cardH  = compact ? 'h-20 sm:h-24' : 'h-24 sm:h-28 md:h-32';

  const staggerDelay = Math.min(index * 60, 500);

  return (
    <Link
      to={`/studio/${studio.slug}`}
      className={`
        relative flex-shrink-0 ${cardW} ${cardH}
        rounded-xl overflow-hidden
        group cursor-pointer
        animate-fade-in-up
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
      `}
      style={{
        animationDelay: `${staggerDelay}ms`,
        animationFillMode: 'both',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Browse ${studio.name}`}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: studio.gradient,
          opacity: hovered ? 1 : 0.85,
        }}
      />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
        }}
      />

      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 transition-opacity duration-300
          ${hovered ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          boxShadow: `inset 0 0 40px rgba(255,255,255,0.08)`,
        }}
      />

      {/* Content */}
      <div className="
        absolute inset-0 flex flex-col
        items-center justify-center
        p-3 text-center
      ">
        {/* Studio name */}
        <span className="
          font-black text-white text-shadow
          text-sm sm:text-base md:text-lg
          leading-tight tracking-tight
          mb-1.5
          transition-transform duration-300
          group-hover:scale-105
        ">
          {studio.name}
        </span>

        {/* Badge */}
        <span className="
          px-2 py-0.5 rounded-full
          text-[9px] font-bold uppercase tracking-widest
          bg-black/30 text-white/80
          border border-white/20
          backdrop-blur-sm
        ">
          {studio.badge}
        </span>

        {/* Hover CTA */}
        <div className={`
          absolute inset-0 flex items-center justify-center
          bg-black/40 backdrop-blur-[2px]
          transition-all duration-300
          ${hovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="
            flex items-center gap-2
            px-3 py-1.5 rounded-full
            bg-white/15 border border-white/30
            text-white text-xs font-semibold
            backdrop-blur-sm
          ">
            <FiPlay className="w-3 h-3 fill-white" />
            Browse
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: studio.gradient }}
      />
    </Link>
  );
};

// ============================================================
// SCROLL ARROW BTN
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

export default StudioRow;