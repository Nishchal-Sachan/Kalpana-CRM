/** @type {import('tailwindcss').Config} */
const brandColors = {
  50:  '#eff2fe',
  100: '#e0e6fc',
  200: '#c7d2fa',
  300: '#a4b5f6',
  400: '#7891ef',
  500: '#4758da',   /* exact logo blue */
  600: '#3645b8',
  700: '#2a369e',
  800: '#232d80',
  900: '#1e2566',
  950: '#121640',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: brandColors,
        solar: brandColors,
      },
    },
  },
  plugins: [],
};
