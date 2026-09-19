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
          base: '#F7FAF8',
          secondary: '#FFFFFF',
          card: '#FFFFFF',
          subtle: '#F0F4F1',
          hover: '#F4F7F5',
          border: '#E3E9E5',
          sidebar: '#FFFFFF',
        },
        brand: {
          green: '#168A5B',
          'green-hover': '#13784F',
          'green-light': '#EBF5F0',
          blue: '#2563EB',
          'blue-light': '#EFF6FF',
          teal: '#0D9488',
          'teal-light': '#F0FDFA',
          amber: '#D97706',
          'amber-light': '#FEF3C7',
          red: '#DC2626',
          'red-light': '#FEE2E2',
        },
        carbon: {
          text: '#1A2E24',
          secondary: '#486255',
          muted: '#768E82',
          border: '#E3E9E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(22, 138, 91, 0.03)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
