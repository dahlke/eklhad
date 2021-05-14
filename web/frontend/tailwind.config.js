const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    maxHeight: {
      "1/4": "25%",
      "1/2": "50%",
      "3/4": "75%",
    },
    inset: {
      "1/10": "10%",
      "1/4": "25%",
    },
    extend: {
      fontFamily: {
        mono: ["VCR OSD Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        "off-white": "#fcfbf9",
        "chicago-flag-blue": "#58b9f7",
        "chicago-flag-red": "#cc0000",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
