// src/components/common/Badge.jsx
// Reusable badge/tag component

import React from 'react';

// ============================================================
// BADGE VARIANTS
// ============================================================

const VARIANTS = {
  default: 'bg-white/10 text-white/70 border-white/10',
  primary: 'bg-primary-600/20 text-primary-400 border-primary-600/30',
  premium: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  danger:  'bg-red-500/15 text-red-400 border-red-500/25',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  purple:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  // Status variants
  public:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  private: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  draft:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] rounded-md',
  sm: 'px-2 py-0.5 text-xs rounded-lg',
  md: 'px-2.5 py-1 text-xs rounded-lg',
  lg: 'px-3 py-1.5 text-sm rounded-xl',
};

// ============================================================
// BADGE COMPONENT
// ============================================================

const Badge = ({
  children,
  variant   = 'default',
  size      = 'sm',
  icon      = null,
  dot       = false,
  className = '',
  ...props
}) => {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  const sizeClass    = SIZES[size] || SIZES.sm;

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold
        border tracking-wide
        ${variantClass}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`
          w-1.5 h-1.5 rounded-full flex-shrink-0
          ${variant === 'success' || variant === 'public'  ? 'bg-emerald-400' : ''}
          ${variant === 'danger'                            ? 'bg-red-400'     : ''}
          ${variant === 'primary'                           ? 'bg-primary-400' : ''}
          ${variant === 'default' || variant === 'private'  ? 'bg-gray-400'   : ''}
          ${variant === 'premium'  || variant === 'draft'   ? 'bg-amber-400'  : ''}
          ${variant === 'info'                              ? 'bg-blue-400'    : ''}
        `} />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// Convenience exports
export const PremiumBadge = ({ children = 'PREMIUM', ...props }) => (
  <Badge variant="premium" size="sm" {...props}>
    ⭐ {children}
  </Badge>
);

export const NewBadge = ({ children = 'NEW', ...props }) => (
  <Badge variant="primary" size="sm" {...props}>
    {children}
  </Badge>
);

export const HDBadge = ({ ...props }) => (
  <Badge variant="info" size="xs" {...props}>
    HD
  </Badge>
);

export default Badge;