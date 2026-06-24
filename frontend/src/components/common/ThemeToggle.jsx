import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const btn = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const ico = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      onClick={toggleTheme}
      className={`${btn} flex items-center justify-center rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 ${className}`}
      aria-label={isDark ? 'Tema claro' : 'Tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      {isDark ? (
        <svg className={`${ico} text-amber-400`} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>
          <line x1="12" y1="2"  x2="12" y2="5"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="2"  y1="12" x2="5"  y2="12"/>
          <line x1="19" y1="12" x2="22" y2="12"/>
          <line x1="4.93"  y1="4.93"  x2="7.05"  y2="7.05"/>
          <line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/>
          <line x1="4.93"  y1="19.07" x2="7.05"  y2="16.95"/>
          <line x1="16.95" y1="7.05"  x2="19.07" y2="4.93"/>
        </svg>
      ) : (
        <svg className={`${ico} text-gray-500`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
