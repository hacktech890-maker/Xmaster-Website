// src/components/common/GlassCard.jsx
// Reusable glassmorphism card wrapper

import React from 'react';

// ============================================================
// GLASS CARD VARIANTS
// ============================================================

const VARIANTS = {
  default: 'bg-white/[0.04] border-white/8 hover:bg-white/[0.07] hover:border-white/15',
  elevated:'bg-dark-200/90 border-white/8 hover:bg-dark-100/90 hover:border-white/12',
  ghost:   'bg-transparent border-white/5 hover:bg-white/[0.03] hover:border-white/8',
  solid:   'bg-dark-300 border-white/8 hover:bg-dark-200 hover:border-white/12',
  accent:  'bg-primary-600/5 border-primary-600/20 hover:bg-primary-600/10 hover:border-primary-600/35',
};

const GlassCard = ({
  children,
  variant   = 'default',
  padding   = true,
  hover     = true,
  glow      = false,
  className = '',
  onClick,
  ...props
}) => {
  const variantClass = VARIANTS[variant] || VARIANTS.default;

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border
        backdrop-blur-sm
        transition-all duration-250
        ${variantClass}
        ${padding ? 'p-5' : ''}
        ${hover ? 'cursor-pointer -translate-y-0' : ''}
        ${hover ? 'hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]' : ''}
        ${glow ? 'hover:shadow-[0_0_30px_rgba(225,29,72,0.15),0_20px_60px_rgba(0,0,0,0.5)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;