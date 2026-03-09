/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 3-Color Minimal Palette
        cream: {
          50: '#F7F3E9',
        },
        blue: {
          muted: '#5A7D9A',
          mutedBright: '#6A8DBA',
        },
        coral: {
          muted: '#E07A5F',
          mutedBright: '#F28C7F',
        },
        slate: {
          text: '#3B3B3B',
        },
      },
    },
  },
  plugins: [],
};
