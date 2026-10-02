/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#f7f7f9',
          dark: '#0b0b0f',
        },
        panel: {
          light: '#ffffff',
          dark: '#15151c',
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#a78bfa',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
