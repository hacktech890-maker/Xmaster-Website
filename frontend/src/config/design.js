// src/config/design.js
// Design system constants — single source of truth for UI values

export const COLORS = {
  // Primary red accent
  primary: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  // Dark backgrounds
  dark: {
    50:  '#2a2a2a',
    100: '#222222',
    200: '#1a1a1a',
    300: '#141414',
    400: '#0f0f0f',
    500: '#0a0a0a',
    600: '#050505',
  },
  // Glass overlays
  glass: {
    white5:  'rgba(255,255,255,0.05)',
    white10: 'rgba(255,255,255,0.10)',
    white15: 'rgba(255,255,255,0.15)',
    white20: 'rgba(255,255,255,0.20)',
    dark5:   'rgba(0,0,0,0.05)',
    dark10:  'rgba(0,0,0,0.10)',
    dark50:  'rgba(0,0,0,0.50)',
    dark70:  'rgba(0,0,0,0.70)',
    dark90:  'rgba(0,0,0,0.90)',
  },
};

export const GRADIENTS = {
  primaryRed: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)',
  darkBg:     'linear-gradient(180deg, #0f0f0f 0%, #141414 100%)',
  heroOverlay:'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 100%)',
  cardOverlay:'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.9) 100%)',
  glowRed:    'radial-gradient(ellipse at center, rgba(225,29,72,0.3) 0%, transparent 70%)',
  sideGlow:   'linear-gradient(90deg, transparent, rgba(225,29,72,0.05), transparent)',
};

export const TYPOGRAPHY = {
  fontPrimary: "'Inter', 'Roboto', sans-serif",
  // Scale
  xs:   '0.75rem',
  sm:   '0.875rem',
  base: '1rem',
  lg:   '1.125rem',
  xl:   '1.25rem',
  '2xl':'1.5rem',
  '3xl':'1.875rem',
  '4xl':'2.25rem',
  '5xl':'3rem',
};

export const SPACING = {
  navHeight:     '64px',
  navHeightSm:   '56px',
  sidebarWidth:  '260px',
  sidebarCollapsed: '72px',
  maxWidth:      '1400px',
  contentWidth:  '1200px',
};

export const ANIMATION = {
  fast:   '150ms ease',
  normal: '250ms ease',
  slow:   '400ms ease',
  slower: '600ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const BREAKPOINTS = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
};

export const BORDER_RADIUS = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  '2xl':'24px',
  full: '9999px',
};