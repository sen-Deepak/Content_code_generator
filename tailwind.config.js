/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A0F29',
        teal: '#2EC4B6',
        gray: {
          50: '#F5F7FA',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
      },
      animation: {
        fadeInUp: 'fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) both',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
