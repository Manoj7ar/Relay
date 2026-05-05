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
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '28px',
      },
      boxShadow: {
        glass: 'var(--shadow-md)',
        'glass-lg': 'var(--shadow-lg)',
        elevate: 'var(--shadow-md)',
        'elevate-lg': 'var(--shadow-lg)',
        sm: 'var(--shadow-sm)',
      },
      minHeight: {
        touch: 'var(--touch)',
      },
      maxWidth: {
        mobile: '430px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        spring: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
      },
      animation: {
        'fade-in': 'fadeIn 240ms var(--ease-out) both',
        'fade-in-fast': 'fadeIn 180ms var(--ease-out) both',
        'route-fade': 'routeFade 200ms var(--ease-out) both',
        'scale-in': 'scaleIn 200ms var(--ease-out) both',
        'slide-up': 'slideUp 280ms var(--ease-out) both',
        'transcript-out':
          'transcriptOut 360ms var(--ease-out) forwards',
        'transcript-demote':
          'transcriptDemote 500ms var(--ease-out) both',
        'sheet-in': 'sheetIn 260ms var(--ease-out) both',
        pulse2: 'pulse2 1.6s ease-in-out infinite',
        'listen-glow': 'listenGlow 1.85s ease-in-out infinite',
        'process-glow': 'processGlow 1.6s ease-in-out infinite',
        'card-listen': 'cardListenPulse 2.2s ease-in-out infinite',
      },
      animationDelay: {
        1: '40ms',
        2: '80ms',
        3: '120ms',
        4: '160ms',
        5: '200ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        routeFade: {
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
        transcriptOut: {
          '0%': { opacity: '0.6', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-12px)' },
        },
        transcriptDemote: {
          '0%': { opacity: '1', transform: 'translateY(40%) scale(1.06)' },
          '100%': { opacity: '0.6', transform: 'translateY(0) scale(1)' },
        },
        sheetIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        listenGlow: {
          '0%, 100%': {
            boxShadow:
              '0 0 0 4px rgba(248, 113, 113, 0.14), 0 4px 14px rgba(0,0,0,0.08)',
          },
          '50%': {
            boxShadow:
              '0 0 0 10px rgba(248, 113, 113, 0.05), 0 6px 20px rgba(0,0,0,0.1)',
          },
        },
        processGlow: {
          '0%, 100%': {
            boxShadow:
              '0 0 0 3px rgba(58, 58, 56, 0.08), 0 4px 14px rgba(0,0,0,0.06)',
          },
          '50%': {
            boxShadow:
              '0 0 0 7px rgba(58, 58, 56, 0.04), 0 6px 18px rgba(0,0,0,0.08)',
          },
        },
        cardListenPulse: {
          '0%, 100%': {
            boxShadow:
              '0 12px 40px -12px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(58,58,56,0.08)',
          },
          '50%': {
            boxShadow:
              '0 14px 48px -10px rgba(0,0,0,0.22), inset 0 0 0 2px rgba(58,58,56,0.14)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
