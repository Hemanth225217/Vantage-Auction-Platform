/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#07090c',
          900: '#0c0f14',
          850: '#11151c',
          800: '#161b24',
          700: '#1f2733',
          600: '#2b3644',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9edc9',
          200: '#f3da93',
          300: '#edc35c',
          400: '#e8b03a',
          500: '#d99a24',
          600: '#b87a1a',
          700: '#935c18',
          800: '#78491a',
          900: '#663d1a',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232,176,58,0.15), 0 8px 40px -8px rgba(232,176,58,0.25)',
        card: '0 4px 24px -4px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(60% 60% at 50% 0%, rgba(232,176,58,0.15) 0%, rgba(7,9,12,0) 70%)',
        noise: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s ease-out both',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
