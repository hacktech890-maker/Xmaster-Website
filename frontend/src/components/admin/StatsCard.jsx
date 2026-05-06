// src/components/admin/StatsCard.jsx
// Premium glassmorphism stats card for admin dashboard
// Supports: trend indicators, sparkline mini-chart, icon, color variants

import React from 'react';
import {
  FiTrendingUp, FiTrendingDown, FiMinus,
  FiArrowUpRight, FiArrowDownRight,
} from 'react-icons/fi';

// ============================================================
// COLOR VARIANTS
// ============================================================

const VARIANTS = {
  red: {
    icon:    'bg-primary-600/15 border-primary-600/20 text-primary-400',
    accent:  'from-primary-600/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(225,29,72,0.12)]',
    bar:     'bg-primary-600',
    trend_up:'text-primary-400',
  },
  blue: {
    icon:    'bg-blue-500/15 border-blue-500/20 text-blue-400',
    accent:  'from-blue-500/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]',
    bar:     'bg-blue-500',
    trend_up:'text-blue-400',
  },
  green: {
    icon:    'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
    accent:  'from-emerald-500/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]',
    bar:     'bg-emerald-500',
    trend_up:'text-emerald-400',
  },
  purple: {
    icon:    'bg-purple-500/15 border-purple-500/20 text-purple-400',
    accent:  'from-purple-500/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]',
    bar:     'bg-purple-500',
    trend_up:'text-purple-400',
  },
  amber: {
    icon:    'bg-amber-500/15 border-amber-500/20 text-amber-400',
    accent:  'from-amber-500/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]',
    bar:     'bg-amber-500',
    trend_up:'text-amber-400',
  },
  cyan: {
    icon:    'bg-cyan-500/15 border-cyan-500/20 text-cyan-400',
    accent:  'from-cyan-500/20 to-transparent',
    glow:    'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]',
    bar:     'bg-cyan-500',
    trend_up:'text-cyan-400',
  },
};

// ============================================================
// MINI SPARKLINE CHART
// ============================================================

const Sparkline = ({ data = [], color = '#e11d48', height = 32 }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const padX = 2;
  const padY = 2;

  const points = data.map((val, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2);
    const y = h - padY - ((val - min) / range) * (h - padY * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  // Area fill path
  const first = points[0].split(',');
  const last  = points[points.length - 1].split(',');
  const area  = `M${first[0]},${h} L${polyline.replace(/,/g, ' ').split(' ').reduce((acc, v, i, arr) => {
    return i === 0 ? `${v},${arr[i+1]}` : acc + ` L${v},${arr[i+1] || v}`;
  })} L${last[0]},${h} Z`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible opacity-70"
    >
      {/* Area fill */}
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};

// ============================================================
// STATS CARD COMPONENT
// ============================================================

const StatsCard = ({
  title,
  value,
  subtitle    = '',
  icon        = null,
  variant     = 'red',
  trend       = null,     // number: positive = up, negative = down, 0 = flat
  trendLabel  = '',       // e.g. "vs last week"
  sparkline   = [],       // array of numbers for mini chart
  loading     = false,
  onClick     = null,
  className   = '',
}) => {
  const v = VARIANTS[variant] || VARIANTS.red;

  const trendUp   = trend > 0;
  const trendDown = trend < 0;
  const trendFlat = trend === 0 || trend === null;

  // Format trend value
  const trendFormatted = trend !== null && trend !== undefined
    ? `${trendUp ? '+' : ''}${Number(trend).toFixed(1)}%`
    : null;

  if (loading) {
    return <StatsCardSkeleton className={className} />;
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative group rounded-2xl overflow-hidden
        bg-dark-300 border border-white/6
        transition-all duration-250
        ${onClick ? 'cursor-pointer' : ''}
        hover:-translate-y-0.5
        hover:border-white/12
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]
        ${v.glow}
        ${className}
      `}
    >
      {/* Top accent gradient */}
      <div className={`
        absolute top-0 left-0 right-0 h-px
        bg-gradient-to-r ${v.accent}
      `} />

      {/* Content */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">

          {/* Left: text */}
          <div className="flex-1 min-w-0">

            {/* Title */}
            <p className="
              text-xs font-semibold text-white/40
              uppercase tracking-widest mb-3
            ">
              {title}
            </p>

            {/* Main value */}
            <p className="
              text-2xl sm:text-3xl font-black text-white
              tracking-tight leading-none mb-1.5
            ">
              {value ?? '—'}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-white/35 mt-1">
                {subtitle}
              </p>
            )}

            {/* Trend indicator */}
            {trendFormatted && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className={`
                  flex items-center gap-0.5
                  text-xs font-bold
                  ${trendUp   ? 'text-emerald-400' : ''}
                  ${trendDown ? 'text-red-400'     : ''}
                  ${trendFlat ? 'text-white/30'    : ''}
                `}>
                  {trendUp   && <FiArrowUpRight   className="w-3.5 h-3.5" />}
                  {trendDown && <FiArrowDownRight  className="w-3.5 h-3.5" />}
                  {trendFlat && <FiMinus           className="w-3.5 h-3.5" />}
                  {trendFormatted}
                </span>
                {trendLabel && (
                  <span className="text-[10px] text-white/25">
                    {trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: icon + sparkline */}
          <div className="flex flex-col items-end gap-3">

            {/* Icon */}
            {icon && (
              <div className={`
                w-10 h-10 rounded-xl
                flex items-center justify-center
                border flex-shrink-0
                ${v.icon}
              `}>
                {icon}
              </div>
            )}

            {/* Sparkline */}
            {sparkline.length >= 2 && (
              <Sparkline
                data={sparkline}
                color={
                  variant === 'red'    ? '#e11d48' :
                  variant === 'blue'   ? '#3b82f6' :
                  variant === 'green'  ? '#10b981' :
                  variant === 'purple' ? '#a855f7' :
                  variant === 'amber'  ? '#f59e0b' :
                  '#06b6d4'
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress bar (optional — shows when trend is positive) */}
      {trendUp && (
        <div className="h-0.5 bg-white/5">
          <div
            className={`h-full ${v.bar} transition-all duration-700`}
            style={{ width: `${Math.min(Math.abs(trend) * 3, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================
// SKELETON
// ============================================================

const StatsCardSkeleton = ({ className = '' }) => (
  <div className={`
    rounded-2xl bg-dark-300 border border-white/6
    p-5 sm:p-6 animate-pulse ${className}
  `}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 rounded skeleton-shimmer bg-dark-200" />
        <div className="h-8 w-32 rounded-lg skeleton-shimmer bg-dark-200" />
        <div className="h-3 w-20 rounded skeleton-shimmer bg-dark-300" />
      </div>
      <div className="w-10 h-10 rounded-xl skeleton-shimmer bg-dark-200" />
    </div>
  </div>
);

export { StatsCardSkeleton };
export default StatsCard;