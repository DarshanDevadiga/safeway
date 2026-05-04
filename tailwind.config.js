/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./js/**/*.js",
    "./server.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0d1117',
        'surface': 'rgba(22, 27, 34, 0.7)',
        'surface-border': 'rgba(255, 255, 255, 0.1)',
        'text-primary': '#ffffff',
        'text-secondary': '#8b949e',
        'accent-blue': '#2f81f7',
        'accent-cyan': '#39d353',
        'accent-purple': '#a371f7',
        'status-critical': '#f85149',
        'status-warning': '#d29922',
        'status-good': '#238636',
      },
      fontFamily: {
        'main': ['Outfit', 'sans-serif'],
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s infinite',
        'slide-in': 'slide-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.6s ease forwards',
      },
      keyframes: {
        'pulse-red': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(248, 81, 73, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(248, 81, 73, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(248, 81, 73, 0)' },
        },
        'slide-in': {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(40px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
