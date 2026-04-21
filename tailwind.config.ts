import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        danger: 'var(--danger)',
        'glass-bg': 'var(--glass-bg)',
        'glass-border': 'var(--glass-border)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '28px',
      },
      boxShadow: {
        glass: '0 10px 40px rgba(0,0,0,0.06)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.08)',
      },
      minHeight: {
        touch: 'var(--touch)',
      },
      maxWidth: {
        mobile: '430px',
      },
      animation: {
        'fade-in': 'fadeIn 240ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'slide-up': 'slideUp 280ms ease-out',
        pulse2: 'pulse2 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
