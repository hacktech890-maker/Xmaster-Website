// src/config/studios.js
// Premium studio/channel definitions
// These map to category slugs in the backend

export const PREMIUM_STUDIOS = [
  {
    id: 'brazzers',
    name: 'Brazzers',
    slug: 'brazzers',
    color: '#ff6b35',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    description: 'World\'s largest premium network',
    badge: 'PREMIUM',
    featured: true,
  },
  {
    id: 'tushy',
    name: 'TUSHY',
    slug: 'tushy',
    color: '#c9a96e',
    gradient: 'linear-gradient(135deg, #c9a96e, #a07850)',
    description: 'Premium luxury productions',
    badge: 'LUXURY',
    featured: true,
  },
  {
    id: 'vixen',
    name: 'Vixen',
    slug: 'vixen',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    description: 'Ultra-premium productions',
    badge: 'ULTRA',
    featured: true,
  },
  {
    id: 'realitykings',
    name: 'Reality Kings',
    slug: 'reality-kings',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    description: 'Real situations, real passion',
    badge: 'PREMIUM',
    featured: true,
  },
  {
    id: 'bangbros',
    name: 'Bang Bros',
    slug: 'bang-bros',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Premium exclusive content',
    badge: 'EXCLUSIVE',
    featured: false,
  },
  {
    id: 'babes',
    name: 'Babes',
    slug: 'babes',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    description: 'Elegant premium content',
    badge: 'PREMIUM',
    featured: false,
  },
  {
    id: 'blacked',
    name: 'Blacked',
    slug: 'blacked',
    color: '#374151',
    gradient: 'linear-gradient(135deg, #4b5563, #1f2937)',
    description: 'Cinematic premium productions',
    badge: 'CINEMATIC',
    featured: false,
  },
  {
    id: 'mofos',
    name: 'MoFos',
    slug: 'mofos',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    description: 'Premium network originals',
    badge: 'NETWORK',
    featured: false,
  },
];

export const FREE_CONTENT_TAGS = [
  'desi', 'mms', 'indian', 'bhabhi', 'tamil',
  'telugu', 'college', 'viral', 'leaked', 'amateur',
  'homemade', 'hidden-cam', 'webcam', 'selfie',
];

export const getFeaturedStudios = () =>
  PREMIUM_STUDIOS.filter(s => s.featured);

export const getStudioBySlug = (slug) =>
  PREMIUM_STUDIOS.find(s => s.slug === slug);