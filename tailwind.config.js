/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: {
          DEFAULT: '#FFFFFF',
          alt: '#F8F9FA',
        },
        // Mint (Primary Brand)
        mint: {
          DEFAULT: '#00D9C0',
          hover: '#00C4AF',
          tint: '#E6FFF9',
        },
        // Neon Pink (CTAs)
        neon: {
          DEFAULT: '#FF006E',
          hover: '#E0005E',
        },
        // Text colors
        text: {
          primary: '#000000',
          secondary: '#4A4A4A',
          caption: '#8E8E8E',
        },
      },
    },
  },
  plugins: [],
}
