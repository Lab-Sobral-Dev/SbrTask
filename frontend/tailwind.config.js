module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ['Ubuntu', 'sans-serif'],
      },
      animation: {
        'logo-reveal':   'logoReveal 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-slide-up': 'fadeSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        logoReveal: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
