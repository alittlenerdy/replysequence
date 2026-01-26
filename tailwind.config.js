/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['var(--font-roboto)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Background colors
        background: {
          DEFAULT: '#F8F9FA',
          alt: '#F5F5F5',
          pure: '#FFFFFF',
        },
        // Primary Blue (Brand)
        mint: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          tint: '#EFF6FF',
        },
        // Blue (CTAs)
        neon: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        // Text colors
        text: {
          primary: '#000000',
          secondary: '#4A4A4A',
          caption: '#8E8E8E',
        },
      },
      animation: {
        'float-slow': 'float 20s ease-in-out infinite',
        'float-medium': 'float 15s ease-in-out infinite',
        'float-fast': 'float 10s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) translateX(10px) rotate(5deg)' },
          '50%': { transform: 'translateY(-10px) translateX(-10px) rotate(-5deg)' },
          '75%': { transform: 'translateY(-30px) translateX(5px) rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}
