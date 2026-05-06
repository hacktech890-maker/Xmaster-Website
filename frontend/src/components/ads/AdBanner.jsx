// src/components/ads/AdBanner.jsx
// Updated generic ad banner — now uses centralized AdSlot

import React from 'react';
import AdSlot from './AdSlot';

// ============================================================
// AD BANNER COMPONENT
// ============================================================

// Simple wrapper for backward compatibility
// Maps legacy size props to new centralized placement system

const AdBanner = ({
  placement = 'watch_bottom',
  delay,
  label     = false,
  className = '',
}) => {
  return (
    <AdSlot
      placement={placement}
      delay={delay}
      label={label}
      className={className}
    />
  );
};

export default AdBanner;