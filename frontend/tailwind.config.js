/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#090d16',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        auction: {
          orange: '#ea580c',
          amber: '#f59e0b',
          darkOrange: '#c2410c',
          lightOrange: '#ffedd5',
        },
        campus: {
          teal: '#0d9488',
          emerald: '#059669',
          crimson: '#dc2626',
          ivory: '#f8fafc',
          card: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
