// frontend/tailwind.config.js
// Updated Tailwind config with complete design system

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],

  // Dark mode via class strategy (ThemeContext applies 'dark' to <html>)
  darkMode: 'class',

  theme: {
    extend: {

      // --------------------------------------------------------
      // COLOR SYSTEM
      // --------------------------------------------------------
      colors: {
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
          950: '#4c0519',
        },
        dark: {
          50:  '#2a2a2a',
          100: '#222222',
          200: '#1a1a1a',
          300: '#141414',
          400: '#0f0f0f',
          500: '#0a0a0a',
          600: '#050505',
        },
        glass: {
          white:  'rgba(255,255,255,0.08)',
          dark:   'rgba(0,0,0,0.60)',
        },
      },

      // --------------------------------------------------------
      // TYPOGRAPHY
      // --------------------------------------------------------
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.02em',
        wide:     '0.05em',
        wider:    '0.1em',
        widest:   '0.2em',
      },

      // --------------------------------------------------------
      // SPACING
      // --------------------------------------------------------
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '30':  '7.5rem',
        '68':  '17rem',
        '76':  '19rem',
        '84':  '21rem',
        '88':  '22rem',
        '92':  '23rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
        '128': '32rem',
        '136': '34rem',
        '144': '36rem',
      },

      // --------------------------------------------------------
      // BORDER RADIUS
      // --------------------------------------------------------
      borderRadius: {
        '2xl':  '1rem',
        '3xl':  '1.25rem',
        '4xl':  '1.5rem',
      },

      // --------------------------------------------------------
      // BACKDROP BLUR
      // --------------------------------------------------------
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // --------------------------------------------------------
      // BOX SHADOWS
      // --------------------------------------------------------
      boxShadow: {
        'glow-sm':  '0 0 15px rgba(225,29,72,0.2)',
        'glow':     '0 0 30px rgba(225,29,72,0.3)',
        'glow-lg':  '0 0 60px rgba(225,29,72,0.4)',
        'premium':  '0 25px 80px rgba(0,0,0,0.6)',
        'card':     '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':'0 20px 60px rgba(0,0,0,0.6)',
        'inner-glow':'inset 0 0 30px rgba(225,29,72,0.1)',
        'navbar':   '0 4px 30px rgba(0,0,0,0.5)',
      },

      // --------------------------------------------------------
      // ANIMATIONS
      // --------------------------------------------------------
      animation: {
        // Override CRA defaults + add new
        'fade-in':       'fadeIn 0.3s ease forwards',
        'fade-in-up':    'fadeInUp 0.4s ease forwards',
        'fade-in-down':  'fadeInDown 0.4s ease forwards',
        'scale-in':      'scaleIn 0.3s ease forwards',
        'scale-bounce':  'scaleInBounce 0.4s ease forwards',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'spin-smooth':   'spinPulse 1s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'gradient-shift':'gradientShift 6s ease infinite',
        'slide-in-right':'slideInRight 0.3s ease forwards',
        'slide-in-left': 'slideInLeft 0.3s ease forwards',
        'slide-up':      'fadeInUp 0.3s ease forwards',
      },

      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(24px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          'from': { opacity: '0', transform: 'translateY(-24px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to':   { opacity: '1', transform: 'scale(1)' },
        },
        scaleInBounce: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '60%':  { opacity: '1', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(225,29,72,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(225,29,72,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition:  '1000px 0' },
        },
        spinPulse: {
          '0%':   { transform: 'rotate(0deg) scale(1)' },
          '50%':  { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        slideInRight: {
          'from': { transform: 'translateX(100%)' },
          'to':   { transform: 'translateX(0)' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-100%)' },
          'to':   { transform: 'translateX(0)' },
        },
      },

      // --------------------------------------------------------
      // TRANSITIONS
      // --------------------------------------------------------
      transitionDuration: {
        '0':   '0ms',
        '175': '175ms',
        '250': '250ms',
        '400': '400ms',
      },

      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // --------------------------------------------------------
      // MAX WIDTHS
      // --------------------------------------------------------
      maxWidth: {
        '8xl':  '88rem',
        '9xl':  '96rem',
        'screen-2xl': '1400px',
      },

      // --------------------------------------------------------
      // Z-INDEX
      // --------------------------------------------------------
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
        'disclaimer': '9999',
      },

      // --------------------------------------------------------
      // ASPECT RATIOS
      // --------------------------------------------------------
      aspectRatio: {
        'video':   '16 / 9',
        'thumb':   '16 / 9',
        'portrait':'9 / 16',
        'square':  '1 / 1',
        '4/3':     '4 / 3',
      },
    },
  },

  plugins: [
    // Custom plugin for component utilities
    function({ addComponents, addUtilities, theme }) {
      addComponents({
        '.container-site': {
          width: '100%',
          maxWidth: '1400px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
      });

      addUtilities({
        '.text-shadow': {
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 20px rgba(0,0,0,0.8)',
        },
        '.bg-dark-gradient': {
          background: 'linear-gradient(180deg, #0f0f0f 0%, #141414 100%)',
        },
        '.bg-primary-gradient': {
          background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
        },
      });
    },
  ],
};