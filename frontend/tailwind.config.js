/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary SOC palette
        soc: {
          bg: '#0a0e1a',
          surface: '#0f1629',
          card: '#141c2e',
          border: '#1e2d4a',
          accent: '#1e3a5f',
        },
        // Cyan for primary actions / active states
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Severity colors
        severity: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#2563eb',
          info: '#64748b',
        },
        // Status colors
        status: {
          healthy: '#16a34a',
          degraded: '#d97706',
          down: '#dc2626',
          pending: '#7c3aed',
          investigating: '#0891b2',
          resolved: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'soc-gradient': 'linear-gradient(135deg, #0a0e1a 0%, #0f1629 50%, #0a0e1a 100%)',
        'card-gradient': 'linear-gradient(145deg, #141c2e 0%, #0f1629 100%)',
        'cyber-grid': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e2d4a' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soc': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'soc-lg': '0 8px 48px rgba(0, 0, 0, 0.6)',
        'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.15)',
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.2)',
        'inner-soc': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        'soc': '8px',
      },
    },
  },
  plugins: [],
};
