/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,vue}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0b1020'
        }
      }
    }
  },
  plugins: []
};
