// src/components/common/ThemeToggle.jsx
// Modern animated theme toggle button

import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ size = 'md', className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  }[size] || 'w-9 h-9';

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size] || 'w-4 h-4';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative ${sizeClass} rounded-xl
        flex items-center justify-center
        bg-white/8 hover:bg-white/15
        border border-white/10 hover:border-white/20
        text-white/60 hover:text-white
        transition-all duration-200
        overflow-hidden
        ${className}
      `}
    >
      <span className={`
        transition-all duration-300 absolute
        ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}
      `}>
        <FiMoon className={iconSize} />
      </span>
      <span className={`
        transition-all duration-300 absolute
        ${!isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}
      `}>
        <FiSun className={iconSize} />
      </span>
    </button>
  );
};

export default ThemeToggle;