// src/components/common/LoadingSpinner.jsx
// Premium loading spinner with multiple size/style variants

import React from 'react';

// ============================================================
// SIZE CONFIG
// ============================================================

const SIZE_MAP = {
  xs:  { outer: 'w-4 h-4',   inner: 'w-3 h-3',   border: 'border-2' },
  sm:  { outer: 'w-6 h-6',   inner: 'w-4 h-4',   border: 'border-2' },
  md:  { outer: 'w-8 h-8',   inner: 'w-5 h-5',   border: 'border-2' },
  lg:  { outer: 'w-12 h-12', inner: 'w-8 h-8',   border: 'border-3' },
  xl:  { outer: 'w-16 h-16', inner: 'w-10 h-10', border: 'border-4' },
  '2xl':{ outer: 'w-20 h-20',inner: 'w-14 h-14', border: 'border-4' },
};

// ============================================================
// SPINNER VARIANTS
// ============================================================

// Default spinner — red ring
const RingSpinner = ({ size = 'md' }) => {
  const s = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <div className={`relative ${s.outer}`}>
      {/* Outer track ring */}
      <div className={`
        absolute inset-0 rounded-full
        ${s.border} border-white/10
      `} />
      {/* Spinning ring */}
      <div className={`
        absolute inset-0 rounded-full
        ${s.border} border-transparent border-t-primary-600
        animate-spin
      `} style={{ animationDuration: '0.8s' }} />
      {/* Inner dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`
          rounded-full bg-primary-600/40
          ${size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}
        `} />
      </div>
    </div>
  );
};

// Pulse spinner — three dots
const PulseSpinner = ({ size = 'md' }) => {
  const dotSize = {
    xs: 'w-1 h-1', sm: 'w-1.5 h-1.5', md: 'w-2 h-2',
    lg: 'w-3 h-3', xl: 'w-4 h-4',
  }[size] || 'w-2 h-2';

  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full bg-primary-600 animate-pulse`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
};

// Bars spinner
const BarsSpinner = ({ size = 'md' }) => {
  const height = {
    sm: [12, 20, 16], md: [16, 28, 20], lg: [24, 40, 32],
  }[size] || [16, 28, 20];

  return (
    <div className="flex items-end gap-1">
      {height.map((h, i) => (
        <div
          key={i}
          className="w-1 bg-primary-600 rounded-full animate-pulse"
          style={{
            height: `${h}px`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const LoadingSpinner = ({
  size       = 'md',
  variant    = 'ring',   // 'ring' | 'pulse' | 'bars'
  fullScreen = false,
  label      = '',
  className  = '',
}) => {

  const spinner = (() => {
    switch (variant) {
      case 'pulse': return <PulseSpinner size={size} />;
      case 'bars':  return <BarsSpinner  size={size} />;
      default:      return <RingSpinner  size={size} />;
    }
  })();

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-400/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {label && (
            <p className="text-white/50 text-sm font-medium animate-pulse">
              {label}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {spinner}
      {label && (
        <p className="text-white/50 text-sm font-medium">
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

// Named exports for specific use cases
export { RingSpinner, PulseSpinner, BarsSpinner };