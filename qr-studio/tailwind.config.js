/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#f7f8f8',
          dark: '#0a0b0f',
        },
        panel: {
          light: '#ffffff',
          dark: '#14151b',
        },
        accent: {
          DEFAULT: '#7A3B5A', // deep plum — contrast-safe for light-mode text/buttons
          bright: '#B5577E', // vivid plum — dark-mode fills/glow
          sand: '#E3CBA5', // fill/accent only — never body text, too light to read reliably
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'elevate-sm': '0 1px 2px rgba(16,24,32,0.04), 0 2px 8px rgba(16,24,32,0.04)',
        elevate: '0 2px 4px rgba(16,24,32,0.04), 0 8px 24px rgba(16,24,32,0.08)',
        'elevate-lg': '0 4px 8px rgba(16,24,32,0.06), 0 16px 40px rgba(16,24,32,0.12)',
        glow: '0 0 0 1px rgba(31,217,196,0.4), 0 0 24px rgba(31,217,196,0.35)',
      },
    },
  },
  plugins: [],
}
