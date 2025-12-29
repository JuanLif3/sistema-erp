const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'apps/frontend/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Forzamos Inter como default
      },
      colors: {
        // Una paleta "Slate" profesional para ERPs (reduce fatiga visual)
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        primary: {
          DEFAULT: '#2563eb', // Azul corporativo serio
          hover: '#1d4ed8',
        }
      },
      boxShadow: {
        // Sombras difusas y elegantes (estilo Vercel/Stripe)
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        'elevated': '0 0 0 1px rgba(0,0,0,0.03), 0 12px 24px -4px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
};