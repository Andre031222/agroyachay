/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 5vw, 4rem)',    { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1':      ['clamp(1.875rem, 3.5vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2':      ['clamp(1.5rem, 2.5vw, 2rem)',   { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'h3':      ['1.25rem',                       { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['1.125rem',                      { lineHeight: '1.65', letterSpacing: '-0.01em',  fontWeight: '400' }],
        'body':    ['1rem',                          { lineHeight: '1.6',  letterSpacing: '-0.01em',  fontWeight: '400' }],
        'sm':      ['0.875rem',                      { lineHeight: '1.5',  letterSpacing: '0',        fontWeight: '400' }],
        'xs':      ['0.75rem',                       { lineHeight: '1.4',  letterSpacing: '0.01em',   fontWeight: '500' }],
        '2xs':     ['0.6875rem',                     { lineHeight: '1.4',  letterSpacing: '0.02em',   fontWeight: '500' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        snug:     '-0.01em',
      },
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        terrasense: {
          green:  '#059669',
          light:  '#10b981',
          dark:   '#047857',
          muted:  '#d1fae5',
        },
      },
      animation: {
        'fade-in':         'fadeIn 0.5s ease-in-out',
        'slide-up':        'slideUp 0.5s ease-out',
        'slide-down':      'slideDown 0.5s ease-out',
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift':  'gradientShift 15s ease infinite',
        'float-slow':      'float 20s ease-in-out infinite',
        'float-slower':    'float 25s ease-in-out infinite',
        'float-medium':    'float 18s ease-in-out infinite',
        'ping-slow':       'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-slower':     'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-very-slow':  'spin 20s linear infinite',
        'bounce-slow':     'bounce 4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%',   backgroundSize: '200% 200%' },
          '50%':      { backgroundPosition: '100% 50%', backgroundSize: '200% 200%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)    translateX(0px)    rotate(0deg)' },
          '33%':      { transform: 'translateY(-30px)  translateX(20px)   rotate(120deg)' },
          '66%':      { transform: 'translateY(30px)   translateX(-20px)  rotate(240deg)' },
        },
      },
    },
  },
  plugins: [],
}
