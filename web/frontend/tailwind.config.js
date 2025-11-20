const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      maxHeight: {
        "1/4": "25%",
        "1/2": "50%",
        "3/4": "75%",
      },
      inset: {
        "1/10": "10%",
        "1/4": "25%",
      },
      fontFamily: {
        sans: ["Open Sans", "Arial", "sans-serif"],
      },
      colors: {
        "off-white": "#fcfbf9",
        "chicago-flag-blue": "#58b9f7",
        "chicago-flag-red": "#cc0000",
      },
    },
  },
  plugins: [],
};
