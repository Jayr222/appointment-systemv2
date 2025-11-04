/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f2ed',
          100: '#d1e5db',
          200: '#a3cbb7',
          300: '#75b193',
          400: '#47976f',
          500: '#31694E',
          600: '#27543e',
          700: '#1d3f2e',
          800: '#142a1f',
          900: '#0a150f',
        },
        green: {
          50: '#e8f2ed',
          100: '#d1e5db',
          200: '#a3cbb7',
          300: '#75b193',
          400: '#47976f',
          500: '#31694E',
          600: '#27543e',
          700: '#1d3f2e',
          800: '#142a1f',
          900: '#0a150f',
        },
        success: {
          500: '#31694E',
          600: '#27543e',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        }
      }
    },
  },
  plugins: [],
}

