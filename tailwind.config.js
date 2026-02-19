/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Background colors
        background: {
          DEFAULT: '#F8F9FA',
          alt: '#F5F5F5',
          pure: '#FFFFFF',
        },
        // Primary Indigo (Brand)
        mint: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          tint: '#EEF2FF',
        },
        // Indigo (CTAs)
        neon: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        // Text colors
        text: {
          primary: '#000000',
          secondary: '#4A4A4A',
          caption: '#8E8E8E',
        },
        // Dark mode colors
        dark: {
          bg: '#0A0A0F',
          'bg-alt': '#12121A',
          'bg-card': '#1A1A24',
          border: '#2A2A3A',
        },
      },
      animation: {
        'float-slow': 'floatOrb 12s ease-in-out infinite',
        'float-medium': 'floatOrb 8s ease-in-out infinite',
        'float-fast': 'floatOrb 5s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-up-delay': 'fadeInUp 0.6s ease-out 0.2s forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'icon-pulse': 'iconPulse 2s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
        'card-fade-in': 'cardFadeIn 0.5s ease-out forwards',
        'row-slide-in': 'rowSlideIn 0.3s ease-out forwards',
        // Orbit animations for HeroAnimation - GPU accelerated
        'orbit-slow': 'orbitSlow 30s linear infinite',
        'orbit-reverse': 'orbitReverse 25s linear infinite',
        'orbit-fast': 'orbitFast 20s linear infinite',
        'orbit-counter': 'orbitCounter 25s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        floatOrb: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(50px, -40px) scale(1.15)' },
          '50%': { transform: 'translate(20px, 30px) scale(0.95)' },
          '75%': { transform: 'translate(-40px, -20px) scale(1.1)' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.8' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        iconPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        cardFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rowSlideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Orbit keyframes - GPU accelerated with transform only
        orbitSlow: {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
        orbitReverse: {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(-360deg)' },
        },
        orbitFast: {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
        orbitCounter: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 60px rgba(99, 102, 241, 0.5), 0 0 120px rgba(79, 70, 229, 0.3)' },
          '50%': { boxShadow: '0 0 100px rgba(99, 102, 241, 0.8), 0 0 200px rgba(79, 70, 229, 0.5)' },
        },
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('light', 'html.light &')
    }
  ],
}
