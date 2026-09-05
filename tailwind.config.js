/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./src/**/*.{html,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        niq: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd0fe',
          300: '#93b2fd',
          400: '#608cf9',
          500: '#3b6cf6',
          600: '#254deb',
          700: '#1d3bce',
          800: '#1e32a6',
          900: '#1e2d83',
          950: '#161c50',
          accent: '#00F0FF',
          crimson: '#FF0055',
          gold: '#FFB800',
        },
        dark: {
          surface: '#0f0f13',
          card: '#18181f',
          border: '#2a2a38',
          hover: '#22222d',
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(59, 108, 246, 0.5)',
        'glow-accent': '0 0 20px -5px rgba(0, 240, 255, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
