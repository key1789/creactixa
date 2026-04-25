/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8f7ff',
          100: '#f0edff',
          200: '#ddd6ff',
          300: '#c3b5ff',
          400: '#a58dff',
          500: '#8766ff',
          600: '#7144f0',
          700: '#5f37c9',
          800: '#4f31a2',
          900: '#39255f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0 14px 38px -22px rgba(18, 23, 38, 0.36)',
      },
      borderRadius: {
        xl2: '1.15rem',
      },
    },
  },
  plugins: [],
}

