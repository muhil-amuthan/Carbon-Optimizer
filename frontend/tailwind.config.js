/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0f1a',
          secondary: '#111827',
          card: '#151d2e',
          hover: '#1a2335',
          sidebar: '#0d1321',
        },
        brand: {
          green: '#10b981',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          purple: '#8b5cf6',
          red: '#ef4444',
        },
        carbon: {
          border: '#1e293b',
          text: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow-green': '0 0 20px rgba(16,185,129,0.2)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.2)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.2)',
        'glow-red': '0 0 20px rgba(239,68,68,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
